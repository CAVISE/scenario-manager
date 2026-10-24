#!/usr/bin/env node

/**
 * Converts OpenDRIVE paramPoly3 geometries into short line geometries.
 *
 * ModuleOpenDrive, used by the browser editor, does not support paramPoly3
 * reliably. CARLA's OSM converter emits them heavily, so this preserves the
 * sampled curve as an ordinary OpenDRIVE polyline for the browser viewer.
 * The original XODR remains the CARLA/simulation source.
 *
 * Usage: node scripts/normalize_xodr_for_opendrive_viewer.mjs input.xodr output.xodr
 */
import { readFile, writeFile } from 'node:fs/promises';

const [inputPath, outputPath] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  throw new Error(
    'Usage: node scripts/normalize_xodr_for_opendrive_viewer.mjs input.xodr output.xodr'
  );
}

// City-scale maps are rendered with a coarser viewer-only approximation.
const MAX_SEGMENT_LENGTH_METERS = 5;
const MIN_SEGMENT_LENGTH_METERS = 0.3;
const number = (value, name) => {
  const result = Number(value);
  if (!Number.isFinite(result)) throw new Error(`Invalid ${name}: ${value}`);
  return result;
};

function attributes(source) {
  return Object.fromEntries(
    [...source.matchAll(/([A-Za-z][\w]*)="([^"]*)"/g)].map(([, key, value]) => [
      key,
      value,
    ])
  );
}

function format(value) {
  return value.toFixed(10);
}

function evaluatePolynomial(coefficients, p) {
  const { a, b, c, d } = coefficients;
  return a + b * p + c * p * p + d * p * p * p;
}

function replaceParamPoly3(geometrySource, polySource) {
  const geometry = attributes(geometrySource);
  const poly = attributes(polySource);
  const s = number(geometry.s, 'geometry s');
  const length = number(geometry.length, 'geometry length');
  const originX = number(geometry.x, 'geometry x');
  const originY = number(geometry.y, 'geometry y');
  const originHeading = number(geometry.hdg, 'geometry hdg');
  const pRange = poly.pRange ?? 'arcLength';
  const u = {
    a: number(poly.aU, 'aU'),
    b: number(poly.bU, 'bU'),
    c: number(poly.cU, 'cU'),
    d: number(poly.dU, 'dU'),
  };
  const v = {
    a: number(poly.aV, 'aV'),
    b: number(poly.bV, 'bV'),
    c: number(poly.cV, 'cV'),
    d: number(poly.dV, 'dV'),
  };
  const segmentCount = Math.max(1, Math.ceil(length / MAX_SEGMENT_LENGTH_METERS));
  const points = [];

  for (let index = 0; index <= segmentCount; index += 1) {
    const progress = index / segmentCount;
    const p = pRange === 'normalized' ? progress : progress * length;
    const localU = evaluatePolynomial(u, p);
    const localV = evaluatePolynomial(v, p);
    points.push({
      x: originX + Math.cos(originHeading) * localU - Math.sin(originHeading) * localV,
      y: originY + Math.sin(originHeading) * localU + Math.cos(originHeading) * localV,
    });
  }

  return points.slice(0, -1).map((point, index) => {
    const next = points[index + 1];
    const dx = next.x - point.x;
    const dy = next.y - point.y;
    const chordLength = Math.hypot(dx, dy);
    if (chordLength <= Number.EPSILON) {
      throw new Error(`Degenerate paramPoly3 at s=${geometry.s}`);
    }
    return [
      `<geometry s="${format(s + (length * index) / segmentCount)}"`,
      ` x="${format(point.x)}" y="${format(point.y)}"`,
      ` hdg="${format(Math.atan2(dy, dx))}" length="${format(chordLength)}">`,
      '<line />',
      '</geometry>',
    ].join('');
  }).join('');
}

function normalizeLinePlanView(_match, source) {
  const geometries = [...source.matchAll(
    /<geometry\b([^>]*)>\s*<line\s*\/>\s*<\/geometry>/g
  )].map(([, geometrySource]) => attributes(geometrySource));

  if (geometries.length === 0) return `<planView>${source}</planView>`;

  const points = geometries.map((geometry) => ({
    x: number(geometry.x, 'geometry x'),
    y: number(geometry.y, 'geometry y'),
  }));
  const final = geometries.at(-1);
  const finalLength = number(final.length, 'geometry length');
  points.push({
    x: number(final.x, 'geometry x') + Math.cos(number(final.hdg, 'geometry hdg')) * finalLength,
    y: number(final.y, 'geometry y') + Math.sin(number(final.hdg, 'geometry hdg')) * finalLength,
  });

  const kept = [points[0]];
  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = kept.at(-1);
    const point = points[index];
    const next = points[index + 1];
    const distanceFromPrevious = Math.hypot(
      point.x - previous.x,
      point.y - previous.y
    );
    const distanceToNext = Math.hypot(next.x - point.x, next.y - point.y);
    if (
      distanceFromPrevious >= MIN_SEGMENT_LENGTH_METERS &&
      distanceToNext >= MIN_SEGMENT_LENGTH_METERS
    ) {
      kept.push(point);
    }
  }
  kept.push(points.at(-1));
  const normalized = [];
  let s = 0;

  for (let index = 0; index < kept.length - 1; index += 1) {
    const point = kept[index];
    const next = kept[index + 1];
    const dx = next.x - point.x;
    const dy = next.y - point.y;
    const length = Math.hypot(dx, dy);
    if (length < MIN_SEGMENT_LENGTH_METERS) continue;
    normalized.push(
      `<geometry s="${format(s)}" x="${format(point.x)}" y="${format(point.y)}" hdg="${format(Math.atan2(dy, dx))}" length="${format(length)}"><line /></geometry>`
    );
    s += length;
  }

  return `<planView>${normalized.join('')}</planView>`;
}

const input = await readFile(inputPath, 'utf8');
let convertedCount = 0;
const output = input.replace(
  /<geometry\b([^>]*)>\s*<paramPoly3\b([^>]*)\/>\s*<\/geometry>/g,
  (...args) => {
    convertedCount += 1;
    return replaceParamPoly3(args[1], args[2]);
  }
);

if (convertedCount === 0) throw new Error('No paramPoly3 geometries found');
const normalized = output
  .replace(/<planView>([\s\S]*?)<\/planView>/g, normalizeLinePlanView)
  .replace(/<road\b([^>]*)>[\s\S]*?<\/road>/g, (road, roadSource) => {
    const length = number(attributes(roadSource).length, 'road length');
    return length < MIN_SEGMENT_LENGTH_METERS ? '' : road;
  })
  .replace(/<road\b([^>]*)>/g, (road, roadSource) => {
    const roadAttributes = attributes(roadSource);
    const viewerName = `road_${roadAttributes.id ?? 'unnamed'}`;
    return /\bname="[^"]*"/.test(road)
      ? road.replace(/\bname="[^"]*"/, `name="${viewerName}"`)
      : road;
  })
  // Legacy ModuleOpenDrive aborts on empty junction declarations. They carry
  // no connection data and are irrelevant to the viewer mesh.
  .replace(/<junction\b[^>]*\/>/g, '');
await writeFile(outputPath, normalized, 'utf8');
console.log(`Converted ${convertedCount} paramPoly3 geometries to viewer-safe line segments.`);
