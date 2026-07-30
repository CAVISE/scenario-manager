import type {
  Car,
  Point,
} from '../../../../../store/types/useEditorStoreTypes';

type Coordinate = { x: number; y: number };
type LaneGeometry = {
  id: string;
  edgeId: string;
  index: number;
  length: number;
  type: string;
  shape: Coordinate[];
};
type LaneConnection = {
  fromEdge: string;
  fromLane: number;
  toEdge: string;
  toLane: number;
};
type SumoNetwork = {
  offsetX: number;
  offsetY: number;
  lanes: LaneGeometry[];
  connections: LaneConnection[];
  edgeLengths: Map<string, number>;
  successors: Map<string, Set<string>>;
};

export type SumoRouteAnchor = {
  edgeId: string;
  laneId: string;
  laneIndex: number;
  pos: number;
  distance: number;
};

export type GeneratedSumoRoute = {
  edges: string;
  depart?: SumoRouteAnchor;
  arrival?: SumoRouteAnchor;
  warnings: string[];
};

export type GeneratedSumoRoutes = Record<string, GeneratedSumoRoute>;

export interface LoadedSumoNetwork {
  filename: string;
  content: string;
}

const MAX_PRECISE_SNAP_DISTANCE = 10;
const MIN_LANE_POSITION_MARGIN = 0.1;
const NON_DRIVING_LANE_TYPES = new Set([
  'biking',
  'border',
  'bus_stop',
  'parking',
  'shoulder',
  'sidewalk',
  'walking',
]);
const DEPART_LANE_KEYWORDS = new Set([
  'allowed',
  'best',
  'best_prob',
  'first',
  'free',
  'random',
]);

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
): GeneratedSumoRoutes {
  const network = parseNetwork(netXml);
  const result: GeneratedSumoRoutes = {};

  cars.forEach((car) => {
    const manualEdges = parseEdgeList(car.sumo_edges);
    const routePoints = points.filter((point) => point.carId === car.id);
    const sumoStart = toSumoCoordinate({ x: car.x, y: car.y }, network);
    if (routePoints.length === 0) {
      if (manualEdges.length > 0) {
        validateVehicleNetworkSettings(network, car, manualEdges);
        const depart = preciseEndpointAnchor(
          network,
          sumoStart,
          null,
          manualEdges,
          'depart',
        );
        assertManualDepartureMatches(car, manualEdges, depart);
        result[car.id] = {
          edges: manualEdges.join(' '),
          depart,
          warnings: [],
        };
        return;
      }
      throw new Error(
        `Vehicle ${car.opencda_name || car.id} has no route points`,
      );
    }

    const sumoPoints = [
      sumoStart,
      ...routePoints.map((point) => toSumoCoordinate(point, network)),
    ];

    const edges =
      manualEdges.length > 0
        ? manualEdges
        : buildEdgeRoute(network, sumoPoints, car);
    validateVehicleNetworkSettings(network, car, edges);
    const warnings: string[] = [];
    let depart = preciseEndpointAnchor(
      network,
      sumoPoints[0],
      routeDirection(sumoPoints, 0),
      edges,
      'depart',
    );
    let arrival = preciseEndpointAnchor(
      network,
      sumoPoints[sumoPoints.length - 1],
      routeDirection(sumoPoints, sumoPoints.length - 1),
      edges,
      'arrival',
    );

    if (!depart) {
      if (manualEdges.length > 0) {
        assertManualDepartureMatches(car, edges, depart);
      }
      warnings.push('precise departure lane/position is ambiguous');
    }
    if (!arrival) {
      warnings.push('precise arrival lane/position is ambiguous');
    }
    if (
      depart &&
      arrival &&
      edges.length === 1 &&
      depart.edgeId === arrival.edgeId &&
      arrival.pos <= depart.pos + MIN_LANE_POSITION_MARGIN
    ) {
      depart = undefined;
      arrival = undefined;
      warnings.push(
        'arrival is not ahead of departure on the single-edge route',
      );
    }

    result[car.id] = {
      edges: edges.join(' '),
      depart,
      arrival,
      warnings,
    };
  });

  return result;
}

function parseEdgeList(value: string | undefined): string[] {
  return value?.trim().split(/\s+/).filter(Boolean) ?? [];
}

function toSumoCoordinate(point: Coordinate, network: SumoNetwork): Coordinate {
  return {
    x: point.x + network.offsetX,
    y: -point.y + network.offsetY,
  };
}

function assertManualDepartureMatches(
  car: Car,
  edges: string[],
  depart: SumoRouteAnchor | undefined,
): void {
  if (depart || (car.sumo_depart_lane?.trim() && car.sumo_depart_pos != null)) {
    return;
  }
  throw new Error(
    `Vehicle ${car.opencda_name || car.id}: its scene spawn is not on the first manual SUMO edge ${edges[0]}. Clear "Route edges" to build the route from scene points, or select a matching first edge and set Depart lane/Depart pos.`,
  );
}

function buildEdgeRoute(
  network: SumoNetwork,
  sumoPoints: Coordinate[],
  car: Car,
): string[] {
  const snappedEdges = sumoPoints.map(
    (point, index) =>
      nearestLane(network.lanes, point, routeDirection(sumoPoints, index))
        .edgeId,
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
  return deduplicateAdjacent(edgeRoute);
}

function validateVehicleNetworkSettings(
  network: SumoNetwork,
  car: Car,
  edges: string[],
): void {
  if (edges.length === 0) return;
  const label = car.opencda_name || car.id;
  const firstEdge = edges[0];
  const departLaneValue = car.sumo_depart_lane?.trim();
  let departLane: LaneGeometry | undefined;

  if (departLaneValue) {
    if (/^\d+$/.test(departLaneValue)) {
      const laneIndex = Number(departLaneValue);
      departLane = network.lanes.find(
        (lane) => lane.edgeId === firstEdge && lane.index === laneIndex,
      );
      if (!departLane || !isDrivingLane(departLane)) {
        throw new Error(
          `Vehicle ${label}: departLane ${departLaneValue} is not a passenger driving lane on edge ${firstEdge}`,
        );
      }
    } else if (!DEPART_LANE_KEYWORDS.has(departLaneValue)) {
      throw new Error(
        `Vehicle ${label}: unsupported SUMO departLane "${departLaneValue}"`,
      );
    }
  }

  if (car.sumo_depart_pos != null) {
    const position = car.sumo_depart_pos;
    if (!Number.isFinite(position) || position < 0) {
      throw new Error(
        `Vehicle ${label}: departPos must be a non-negative number`,
      );
    }
    const laneLength = departLane?.length ?? network.edgeLengths.get(firstEdge);
    if (laneLength != null && position >= laneLength) {
      throw new Error(
        `Vehicle ${label}: departPos ${position} is outside edge ${firstEdge} (length ${laneLength.toFixed(2)})`,
      );
    }
  }

  const stop = car.sumo_stop;
  if (!stop) return;
  const stopLaneId = stop.lane.trim();
  if (!stopLaneId) {
    throw new Error(
      `Vehicle ${label}: Static stop is enabled but its Lane field is empty`,
    );
  }
  const stopLane = network.lanes.find((lane) => lane.id === stopLaneId);
  if (!stopLane || !isDrivingLane(stopLane)) {
    throw new Error(
      `Vehicle ${label}: stop lane "${stopLaneId}" is not a passenger driving lane`,
    );
  }
  if (!edges.includes(stopLane.edgeId)) {
    throw new Error(
      `Vehicle ${label}: stop lane "${stopLaneId}" is not part of its route`,
    );
  }
  if (
    !Number.isFinite(stop.startPos) ||
    !Number.isFinite(stop.endPos) ||
    stop.startPos < 0 ||
    stop.endPos <= stop.startPos ||
    stop.endPos > stopLane.length
  ) {
    throw new Error(
      `Vehicle ${label}: stop positions must satisfy 0 <= startPos < endPos <= ${stopLane.length.toFixed(2)}`,
    );
  }
  if (!Number.isFinite(stop.duration) || stop.duration < 0) {
    throw new Error(
      `Vehicle ${label}: stop duration must be a non-negative number`,
    );
  }
  if (
    stopLane.edgeId === firstEdge &&
    edges.lastIndexOf(firstEdge) === 0 &&
    car.sumo_depart_pos != null &&
    stop.endPos <= car.sumo_depart_pos
  ) {
    throw new Error(
      `Vehicle ${label}: stop on ${stopLaneId} is behind departPos ${car.sumo_depart_pos}`,
    );
  }
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
        const fallbackLength = polylineLength(shape);
        const parsedLength = Number(lane.getAttribute('length'));
        const length =
          Number.isFinite(parsedLength) && parsedLength > 0
            ? parsedLength
            : fallbackLength;
        const laneIndexValue = lane.getAttribute('index');
        const laneIndex = Number(laneIndexValue);
        const laneId = lane.getAttribute('id');
        if (
          !laneId ||
          laneIndexValue == null ||
          !Number.isInteger(laneIndex) ||
          length <= 0
        ) {
          return;
        }
        lanes.push({
          id: laneId,
          edgeId,
          index: laneIndex,
          length,
          type: (lane.getAttribute('type') ?? '').trim().toLowerCase(),
          shape,
        });
        longestLane = Math.max(longestLane, length);
      });
    if (longestLane > 0) edgeLengths.set(edgeId, longestLane);
  });

  if (lanes.length === 0) {
    throw new Error('SUMO network contains no passenger vehicle edges');
  }

  const successors = new Map<string, Set<string>>();
  const connections: LaneConnection[] = [];
  edgeLengths.forEach((_length, edgeId) => successors.set(edgeId, new Set()));
  Array.from(document.getElementsByTagName('connection')).forEach(
    (connection) => {
      const source = connection.getAttribute('from');
      const destination = connection.getAttribute('to');
      const fromLaneValue = connection.getAttribute('fromLane');
      const toLaneValue = connection.getAttribute('toLane');
      const fromLane = Number(fromLaneValue);
      const toLane = Number(toLaneValue);
      if (
        source &&
        destination &&
        successors.has(source) &&
        edgeLengths.has(destination)
      ) {
        successors.get(source)?.add(destination);
        if (
          fromLaneValue != null &&
          toLaneValue != null &&
          Number.isInteger(fromLane) &&
          Number.isInteger(toLane)
        ) {
          connections.push({
            fromEdge: source,
            fromLane,
            toEdge: destination,
            toLane,
          });
        }
      }
    },
  );

  return {
    offsetX,
    offsetY,
    lanes,
    connections,
    edgeLengths,
    successors,
  };
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

function nearestLane(
  lanes: LaneGeometry[],
  point: Coordinate,
  direction: Coordinate | null,
): SumoRouteAnchor {
  let best: SumoRouteAnchor | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  const drivingLanes = lanes.filter((lane) => isDrivingLane(lane));
  const candidates = drivingLanes.length > 0 ? drivingLanes : lanes;
  const projected = candidates.map((lane) => ({
    lane,
    nearest: distanceToShape(point, lane.shape),
  }));
  const aligned = direction
    ? projected.filter(({ nearest }) => {
        if (!nearest.direction) return false;
        return (
          direction.x * nearest.direction.x +
            direction.y * nearest.direction.y >
          0
        );
      })
    : projected;
  const pool = aligned.length > 0 ? aligned : projected;

  pool.forEach(({ lane, nearest }) => {
    let score = Math.sqrt(nearest.distanceSquared);
    if (direction && nearest.direction) {
      const alignment =
        direction.x * nearest.direction.x + direction.y * nearest.direction.y;
      score += (1 - alignment) * 10;
    }
    if (score < bestScore) {
      bestScore = score;
      best = laneAnchor(lane, nearest);
    }
  });

  if (!best) {
    throw new Error('Could not match route point to a directed SUMO lane');
  }
  return best;
}

function preciseEndpointAnchor(
  network: SumoNetwork,
  point: Coordinate,
  direction: Coordinate | null,
  edges: string[],
  endpoint: 'depart' | 'arrival',
): SumoRouteAnchor | undefined {
  if (edges.length === 0) return undefined;
  const edgeId = endpoint === 'depart' ? edges[0] : edges[edges.length - 1];
  const compatibleLanes = network.lanes.filter(
    (lane) =>
      lane.edgeId === edgeId &&
      isDrivingLane(lane) &&
      endpointConnectionMatches(network, lane, edges, endpoint),
  );

  let best: SumoRouteAnchor | undefined;
  let bestScore = Number.POSITIVE_INFINITY;
  compatibleLanes.forEach((lane) => {
    const nearest = distanceToShape(point, lane.shape);
    const alignment =
      direction && nearest.direction
        ? direction.x * nearest.direction.x + direction.y * nearest.direction.y
        : null;
    if (alignment != null && alignment <= 0) return;
    const distance = Math.sqrt(nearest.distanceSquared);
    if (distance > MAX_PRECISE_SNAP_DISTANCE) return;
    const score = distance + (alignment == null ? 0 : (1 - alignment) * 10);
    if (score < bestScore) {
      bestScore = score;
      best = laneAnchor(lane, nearest);
    }
  });
  return best;
}

function endpointConnectionMatches(
  network: SumoNetwork,
  lane: LaneGeometry,
  edges: string[],
  endpoint: 'depart' | 'arrival',
): boolean {
  if (edges.length < 2) return true;
  if (endpoint === 'depart') {
    return network.connections.some(
      (connection) =>
        connection.fromEdge === edges[0] &&
        connection.fromLane === lane.index &&
        connection.toEdge === edges[1],
    );
  }
  return network.connections.some(
    (connection) =>
      connection.fromEdge === edges[edges.length - 2] &&
      connection.toEdge === edges[edges.length - 1] &&
      connection.toLane === lane.index,
  );
}

function isDrivingLane(lane: LaneGeometry): boolean {
  return !NON_DRIVING_LANE_TYPES.has(lane.type);
}

function laneAnchor(
  lane: LaneGeometry,
  nearest: ShapeProjection,
): SumoRouteAnchor {
  const geometricLength = polylineLength(lane.shape);
  const scaledPosition =
    geometricLength > 0
      ? (nearest.position / geometricLength) * lane.length
      : nearest.position;
  return {
    edgeId: lane.edgeId,
    laneId: lane.id,
    laneIndex: lane.index,
    pos: clampLanePosition(scaledPosition, lane.length),
    distance: Math.sqrt(nearest.distanceSquared),
  };
}

function clampLanePosition(position: number, laneLength: number): number {
  if (laneLength <= MIN_LANE_POSITION_MARGIN * 2) {
    return Math.max(0, Math.min(laneLength, position));
  }
  return Math.max(
    MIN_LANE_POSITION_MARGIN,
    Math.min(laneLength - MIN_LANE_POSITION_MARGIN, position),
  );
}

type ShapeProjection = {
  distanceSquared: number;
  direction: Coordinate | null;
  position: number;
};

function distanceToShape(
  point: Coordinate,
  shape: Coordinate[],
): ShapeProjection {
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestDirection: Coordinate | null = null;
  let bestPosition = 0;
  let lengthBeforeSegment = 0;

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
      bestPosition = lengthBeforeSegment + projection * length;
    }
    lengthBeforeSegment += Math.sqrt(lengthSquared);
  }

  return {
    distanceSquared: bestDistance,
    direction: bestDirection,
    position: bestPosition,
  };
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
