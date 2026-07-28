import type {
  Car,
  Point,
} from '../../../../../store/types/useEditorStoreTypes';

type Coordinate = { x: number; y: number };
type LaneGeometry = {
  edgeId: string;
  shape: Coordinate[];
};
type SumoNetwork = {
  offsetX: number;
  offsetY: number;
  lanes: LaneGeometry[];
  edgeLengths: Map<string, number>;
  successors: Map<string, Set<string>>;
};

export interface LoadedSumoNetwork {
  filename: string;
  content: string;
}

let loadedNetwork: LoadedSumoNetwork | null = null;

export function isSumoNetXml(content: string): boolean {
  if (!/<\s*net(?:\s|>)/i.test(content)) return false;
  const document = new DOMParser().parseFromString(content, 'application/xml');
  return document.querySelector('parsererror') === null;
}

export function setLoadedSumoNetwork(
  filename: string,
  content: string,
): LoadedSumoNetwork {
  if (!isSumoNetXml(content)) {
    throw new Error('Selected file is not a valid SUMO .net.xml network');
  }
  loadedNetwork = { filename, content };
  return loadedNetwork;
}

export function getLoadedSumoNetwork(): LoadedSumoNetwork | null {
  return loadedNetwork;
}

export function clearLoadedSumoNetwork(): void {
  loadedNetwork = null;
}

export async function resolveSumoNetwork(
  filename: string,
): Promise<LoadedSumoNetwork> {
  if (loadedNetwork) return { filename, content: loadedNetwork.content };

  const response = await fetch(`./${filename}`);
  if (!response.ok) {
    throw new Error(
      `SUMO network ${filename} is unavailable; load it in SUMO settings`,
    );
  }
  return setLoadedSumoNetwork(filename, await response.text());
}

export function buildSumoRoutes(
  netXml: string,
  cars: Car[],
  points: Point[],
): Record<string, string> {
  const network = parseNetwork(netXml);
  const result: Record<string, string> = {};

  cars.forEach((car) => {
    if (car.sumo_edges?.trim()) return;

    const routePoints = points.filter((point) => point.carId === car.id);
    if (routePoints.length === 0) {
      throw new Error(
        `Vehicle ${car.opencda_name || car.id} has no route points`,
      );
    }

    const sumoPoints = [
      { x: car.x, y: car.y },
      ...routePoints.map((point) => ({ x: point.x, y: point.y })),
    ].map((point) => ({
      x: point.x + network.offsetX,
      y: -point.y + network.offsetY,
    }));

    const snappedEdges = sumoPoints.map((point, index) =>
      nearestEdge(network.lanes, point, routeDirection(sumoPoints, index)),
    );

    const edgeRoute: string[] = [];
    for (let index = 0; index < snappedEdges.length - 1; index += 1) {
      const start = snappedEdges[index];
      const destination = snappedEdges[index + 1];
      const segment = shortestPath(network, start, destination);
      if (segment.length === 0) {
        throw new Error(
          `No connected SUMO route for vehicle ${
            car.opencda_name || car.id
          } between edges ${start} and ${destination}`,
        );
      }
      edgeRoute.push(
        ...(edgeRoute[edgeRoute.length - 1] === segment[0]
          ? segment.slice(1)
          : segment),
      );
    }

    result[car.id] = deduplicateAdjacent(edgeRoute).join(' ');
  });

  return result;
}

function parseNetwork(netXml: string): SumoNetwork {
  const document = new DOMParser().parseFromString(netXml, 'application/xml');
  if (document.querySelector('parsererror')) {
    throw new Error('SUMO network contains invalid XML');
  }

  const [offsetX, offsetY] = parsePair(
    document.querySelector('location')?.getAttribute('netOffset') ?? '0,0',
  );
  const lanes: LaneGeometry[] = [];
  const edgeLengths = new Map<string, number>();

  Array.from(document.getElementsByTagName('edge')).forEach((edge) => {
    const edgeId = edge.getAttribute('id');
    if (!edgeId || edge.getAttribute('function') === 'internal') return;

    let longestLane = 0;
    Array.from(edge.children)
      .filter((element) => element.tagName === 'lane')
      .forEach((lane) => {
        if (!allowsPassenger(lane)) return;
        const shape = parseShape(lane.getAttribute('shape') ?? '');
        if (shape.length < 2) return;
        lanes.push({ edgeId, shape });
        const fallbackLength = polylineLength(shape);
        const parsedLength = Number(lane.getAttribute('length'));
        longestLane = Math.max(
          longestLane,
          Number.isFinite(parsedLength) && parsedLength > 0
            ? parsedLength
            : fallbackLength,
        );
      });
    if (longestLane > 0) edgeLengths.set(edgeId, longestLane);
  });

  if (lanes.length === 0) {
    throw new Error('SUMO network contains no passenger vehicle edges');
  }

  const successors = new Map<string, Set<string>>();
  edgeLengths.forEach((_length, edgeId) => successors.set(edgeId, new Set()));
  Array.from(document.getElementsByTagName('connection')).forEach(
    (connection) => {
      const source = connection.getAttribute('from');
      const destination = connection.getAttribute('to');
      if (
        source &&
        destination &&
        successors.has(source) &&
        edgeLengths.has(destination)
      ) {
        successors.get(source)?.add(destination);
      }
    },
  );

  return { offsetX, offsetY, lanes, edgeLengths, successors };
}

function allowsPassenger(lane: Element): boolean {
  const allowedValue = (lane.getAttribute('allow') ?? '').trim();
  const allowed = new Set(allowedValue.split(/\s+/));
  const disallowed = new Set(
    (lane.getAttribute('disallow') ?? '').split(/\s+/),
  );
  if (allowedValue && !allowed.has('passenger')) return false;
  return !disallowed.has('all') && !disallowed.has('passenger');
}

function parsePair(value: string): [number, number] {
  const values = value.split(',').map(Number);
  if (values.length !== 2 || values.some((item) => !Number.isFinite(item))) {
    throw new Error(`Invalid SUMO coordinate pair: ${value}`);
  }
  return [values[0], values[1]];
}

function parseShape(value: string): Coordinate[] {
  return value
    .split(/\s+/)
    .map((item) => item.split(',').slice(0, 2).map(Number))
    .filter(
      (coordinates) =>
        coordinates.length === 2 &&
        coordinates.every((item) => Number.isFinite(item)),
    )
    .map(([x, y]) => ({ x, y }));
}

function polylineLength(shape: Coordinate[]): number {
  let result = 0;
  for (let index = 0; index < shape.length - 1; index += 1) {
    result += Math.hypot(
      shape[index + 1].x - shape[index].x,
      shape[index + 1].y - shape[index].y,
    );
  }
  return result;
}

function routeDirection(
  points: Coordinate[],
  index: number,
): Coordinate | null {
  const start = index + 1 < points.length ? points[index] : points[index - 1];
  const end = index + 1 < points.length ? points[index + 1] : points[index];
  if (!start || !end) return null;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  return length < 1e-6 ? null : { x: dx / length, y: dy / length };
}

function nearestEdge(
  lanes: LaneGeometry[],
  point: Coordinate,
  direction: Coordinate | null,
): string {
  let bestEdge = '';
  let bestScore = Number.POSITIVE_INFINITY;

  lanes.forEach((lane) => {
    const nearest = distanceToShape(point, lane.shape);
    let score = Math.sqrt(nearest.distanceSquared);
    if (direction && nearest.direction) {
      const alignment =
        direction.x * nearest.direction.x + direction.y * nearest.direction.y;
      score += (1 - alignment) * 10;
    }
    if (score < bestScore) {
      bestScore = score;
      bestEdge = lane.edgeId;
    }
  });

  if (!bestEdge) throw new Error('Could not match route point to SUMO edge');
  return bestEdge;
}

function distanceToShape(
  point: Coordinate,
  shape: Coordinate[],
): { distanceSquared: number; direction: Coordinate | null } {
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestDirection: Coordinate | null = null;

  for (let index = 0; index < shape.length - 1; index += 1) {
    const start = shape[index];
    const end = shape[index + 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared <= 1e-12) continue;
    const projection = Math.max(
      0,
      Math.min(
        1,
        ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared,
      ),
    );
    const nearestX = start.x + projection * dx;
    const nearestY = start.y + projection * dy;
    const distanceSquared =
      (point.x - nearestX) ** 2 + (point.y - nearestY) ** 2;
    if (distanceSquared < bestDistance) {
      const length = Math.sqrt(lengthSquared);
      bestDistance = distanceSquared;
      bestDirection = { x: dx / length, y: dy / length };
    }
  }

  return { distanceSquared: bestDistance, direction: bestDirection };
}

function shortestPath(
  network: SumoNetwork,
  start: string,
  destination: string,
): string[] {
  if (start === destination) return [start];

  const distances = new Map<string, number>([[start, 0]]);
  const previous = new Map<string, string>();
  const queue = new MinHeap();
  queue.push({ distance: 0, edgeId: start });

  while (queue.size > 0) {
    const current = queue.pop();
    if (!current || current.distance !== distances.get(current.edgeId)) {
      continue;
    }
    if (current.edgeId === destination) break;
    network.successors.get(current.edgeId)?.forEach((successor) => {
      const candidate =
        current.distance + (network.edgeLengths.get(successor) ?? 1);
      if (candidate >= (distances.get(successor) ?? Number.POSITIVE_INFINITY)) {
        return;
      }
      distances.set(successor, candidate);
      previous.set(successor, current.edgeId);
      queue.push({ distance: candidate, edgeId: successor });
    });
  }

  if (!distances.has(destination)) return [];
  const result = [destination];
  while (result[result.length - 1] !== start) {
    const predecessor = previous.get(result[result.length - 1] ?? '');
    if (!predecessor) return [];
    result.push(predecessor);
  }
  return result.reverse();
}

function deduplicateAdjacent(values: string[]): string[] {
  return values.filter(
    (value, index) => index === 0 || values[index - 1] !== value,
  );
}

class MinHeap {
  private values: Array<{ distance: number; edgeId: string }> = [];

  get size(): number {
    return this.values.length;
  }

  push(value: { distance: number; edgeId: string }) {
    this.values.push(value);
    let index = this.values.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.values[parent].distance <= this.values[index].distance) break;
      [this.values[parent], this.values[index]] = [
        this.values[index],
        this.values[parent],
      ];
      index = parent;
    }
  }

  pop(): { distance: number; edgeId: string } | undefined {
    const root = this.values[0];
    const last = this.values.pop();
    if (!last || this.values.length === 0) return root;
    this.values[0] = last;

    let index = 0;
    while (index * 2 + 1 < this.values.length) {
      const left = index * 2 + 1;
      const right = left + 1;
      let smallest = index;
      if (
        left < this.values.length &&
        this.values[left].distance < this.values[smallest].distance
      ) {
        smallest = left;
      }
      if (
        right < this.values.length &&
        this.values[right].distance < this.values[smallest].distance
      ) {
        smallest = right;
      }
      if (smallest === index) break;
      [this.values[smallest], this.values[index]] = [
        this.values[index],
        this.values[smallest],
      ];
      index = smallest;
    }
    return root;
  }
}
