import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  createRouteLine,
  updateRouteLinesForCar,
  updateRouteLinesForWaypoint,
} from './routeLine';

describe('updateRouteLinesForWaypoint', () => {
  it('updates both route segments adjacent to the moved waypoint', () => {
    const car = new THREE.Mesh();
    const first = new THREE.Mesh();
    const second = new THREE.Mesh();
    car.position.set(0, 0, 0);
    first.position.set(10, 0, 0);
    second.position.set(20, 0, 0);

    const firstLine = createRouteLine(car.position, first.position);
    const secondLine = createRouteLine(first.position, second.position);
    const firstGeometry = firstLine.geometry;
    const secondGeometry = secondLine.geometry;

    first.position.set(12, 8, 0);
    updateRouteLinesForWaypoint(
      0,
      car,
      [first, second],
      [firstLine, secondLine]
    );

    expect(firstLine.geometry).not.toBe(firstGeometry);
    expect(secondLine.geometry).not.toBe(secondGeometry);
  });
});

describe('updateRouteLinesForCar', () => {
  it('updates the first segment when the car moves', () => {
    const car = new THREE.Mesh();
    const first = new THREE.Mesh();
    car.position.set(0, 0, 0);
    first.position.set(10, 0, 0);
    const line = createRouteLine(car.position, first.position);
    const previousGeometry = line.geometry;

    car.position.set(4, 5, 0);
    updateRouteLinesForCar(car, [first], [line]);

    expect(line.geometry).not.toBe(previousGeometry);
  });
});
