// A viewer-only approximation: a dense 1 m conversion exhausts the legacy
// ModuleOpenDrive heap on city-scale maps.
const MAX_SEGMENT_LENGTH_M = 5;
const MIN_SEGMENT_LENGTH_M = 0.3;

type Point = { x: number; y: number };

function numberAttribute(element: Element, name: string): number {
  const value = Number(element.getAttribute(name));
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid ${name} on OpenDRIVE geometry`);
  }
  return value;
}

function format(value: number): string {
  return value.toFixed(10);
}

function childElements(element: Element, tagName?: string): Element[] {
  return Array.from(element.children).filter(
    (child) => !tagName || child.tagName === tagName
  );
}

function pointOnGeometry(geometry: Element, distance: number): Point {
  const x = numberAttribute(geometry, 'x');
  const y = numberAttribute(geometry, 'y');
  const heading = numberAttribute(geometry, 'hdg');
  const primitive = geometry.firstElementChild;
  if (!primitive) throw new Error('OpenDRIVE geometry has no primitive');

  let u: number;
  let v: number;
  if (primitive.tagName === 'line') {
    u = distance;
    v = 0;
  } else if (primitive.tagName === 'arc') {
    const curvature = numberAttribute(primitive, 'curvature');
    if (Math.abs(curvature) < Number.EPSILON) {
      u = distance;
      v = 0;
    } else {
      const angle = curvature * distance;
      u = Math.sin(angle) / curvature;
      v = (1 - Math.cos(angle)) / curvature;
    }
  } else if (primitive.tagName === 'paramPoly3') {
    const length = numberAttribute(geometry, 'length');
    const parameter =
      primitive.getAttribute('pRange') === 'normalized'
        ? distance / length
        : distance;
    const polynomial = (prefix: 'U' | 'V') => {
      const a = numberAttribute(primitive, `a${prefix}`);
      const b = numberAttribute(primitive, `b${prefix}`);
      const c = numberAttribute(primitive, `c${prefix}`);
      const d = numberAttribute(primitive, `d${prefix}`);
      return a + b * parameter + c * parameter ** 2 + d * parameter ** 3;
    };
    u = polynomial('U');
    v = polynomial('V');
  } else {
    throw new Error(`Unsupported OpenDRIVE primitive: ${primitive.tagName}`);
  }

  return {
    x: x + Math.cos(heading) * u - Math.sin(heading) * v,
    y: y + Math.sin(heading) * u + Math.cos(heading) * v,
  };
}

function samplePlanView(planView: Element): Point[] {
  const points: Point[] = [];
  for (const geometry of childElements(planView, 'geometry')) {
    const length = numberAttribute(geometry, 'length');
    if (length <= 0) continue;
    const steps = Math.max(1, Math.ceil(length / MAX_SEGMENT_LENGTH_M));
    for (let index = 0; index <= steps; index += 1) {
      if (points.length && index === 0) continue;
      points.push(pointOnGeometry(geometry, (length * index) / steps));
    }
  }
  return points;
}

function appendLineGeometry(
  document: XMLDocument,
  planView: Element,
  start: Point,
  end: Point,
  s: number
): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length < MIN_SEGMENT_LENGTH_M) return 0;

  const geometry = document.createElement('geometry');
  geometry.setAttribute('s', format(s));
  geometry.setAttribute('x', format(start.x));
  geometry.setAttribute('y', format(start.y));
  geometry.setAttribute('hdg', format(Math.atan2(dy, dx)));
  geometry.setAttribute('length', format(length));
  geometry.append(document.createElement('line'));
  planView.append(geometry);
  return length;
}

function replacePlanView(document: XMLDocument, planView: Element): void {
  const points = samplePlanView(planView);
  const kept = points.length ? [points[0]] : [];
  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = kept[kept.length - 1];
    const current = points[index];
    const next = points[index + 1];
    if (
      previous &&
      Math.hypot(current.x - previous.x, current.y - previous.y) >=
        MIN_SEGMENT_LENGTH_M &&
      Math.hypot(next.x - current.x, next.y - current.y) >= MIN_SEGMENT_LENGTH_M
    ) {
      kept.push(current);
    }
  }
  if (points.length > 1) kept.push(points[points.length - 1]);

  planView.replaceChildren();
  let s = 0;
  for (let index = 0; index < kept.length - 1; index += 1) {
    s += appendLineGeometry(
      document,
      planView,
      kept[index],
      kept[index + 1],
      s
    );
  }
}

function normalizeShortRoad(
  document: XMLDocument,
  road: Element,
  planView: Element
): void {
  const points = samplePlanView(planView);
  const firstGeometry = childElements(planView, 'geometry')[0];
  if (!points.length || !firstGeometry) {
    planView.replaceChildren();
    return;
  }

  const start = points[0];
  const end = points[points.length - 1];
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const heading =
    Math.hypot(dx, dy) < Number.EPSILON
      ? numberAttribute(firstGeometry, 'hdg')
      : Math.atan2(dy, dx);
  const normalizedEnd = {
    x: start.x + Math.cos(heading) * MIN_SEGMENT_LENGTH_M,
    y: start.y + Math.sin(heading) * MIN_SEGMENT_LENGTH_M,
  };

  planView.replaceChildren();
  appendLineGeometry(document, planView, start, normalizedEnd, 0);
  road.setAttribute('length', format(MIN_SEGMENT_LENGTH_M));
}

function hasNonAsciiRoadName(road: Element): boolean {
  const name = road.getAttribute('name') ?? '';
  return Array.from(name).some((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint !== undefined && codePoint > 0x7f;
  });
}

/**
 * Adapts a canonical CARLA XODR only in browser memory for the legacy WASM
 * renderer. The caller must retain the original string for simulation.
 */
export function prepareXodrForModuleOpenDrive(xodr: string): string {
  const document = new DOMParser().parseFromString(xodr, 'application/xml');
  if (document.querySelector('parsererror')) {
    throw new Error('Unable to parse OpenDRIVE XML');
  }

  const roads = Array.from(document.getElementsByTagName('road'));
  const needsAdaptation = roads.some((road) => {
    const length = Number(road.getAttribute('length'));
    return (
      hasNonAsciiRoadName(road) ||
      (Number.isFinite(length) &&
        length > 0 &&
        length < MIN_SEGMENT_LENGTH_M) ||
      Boolean(road.querySelector('planView > geometry > paramPoly3'))
    );
  });
  if (!needsAdaptation) return xodr;

  for (const road of roads) {
    const roadLength = numberAttribute(road, 'length');
    const planView = road.querySelector('planView');
    const hasParamPoly3 = Boolean(
      planView?.querySelector('geometry > paramPoly3')
    );

    if (roadLength > 0 && roadLength < MIN_SEGMENT_LENGTH_M && planView) {
      normalizeShortRoad(document, road, planView);
    } else if (hasParamPoly3 && planView) {
      replacePlanView(document, planView);
    }

    // Older ModuleOpenDrive builds assume byte strings for road names.
    road.setAttribute('name', `road_${road.getAttribute('id') ?? 'unnamed'}`);
  }

  return new XMLSerializer().serializeToString(document);
}
