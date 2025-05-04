import { create } from 'zustand';
import { nanoid } from 'nanoid';

export type Car = {
  id: string;
  x: number;
  y: number;
  z: number;
  color: string;
  model: string;
};

export type Point = {
  id: string;
  x: number;
  y: number;
  z: number;
};

type EditorState = {
  cars: Car[];
  points: Point[];
  selectedId: string | null;

  addCar: (x: number, y: number, z: number, model: string, color: string) => void;
  updateCar: (id: string, props: Partial<Omit<Car, 'id'>>) => void;
  removeCar: (id: string) => void;

  addPoint: (x: number, y: number, z: number) => void;
  updatePoint: (id: string, props: Partial<Omit<Point, 'id'>>) => void;
  removePoint: (id: string) => void;

  selectObject: (id: string | null) => void;
};

export const useEditorStore = create<EditorState>(set => ({
  cars: [],
  points: [],
  selectedId: null,

  addCar: (x, y, z, model, color) =>
    set(s => ({
      cars: [...s.cars, { id: nanoid(), x, y, z, model, color }],
    })),

  updateCar: (id, props) =>
    set(s => ({
      cars: s.cars.map(c => (c.id === id ? { ...c, ...props } : c)),
    })),

  removeCar: id =>
    set(s => ({
      cars: s.cars.filter(c => c.id !== id),
    })),

  addPoint: (x, y, z) =>
    set(s => ({
      points: [...s.points, { id: nanoid(), x, y, z }],
    })),

  updatePoint: (id, props) =>
    set(s => ({
      points: s.points.map(p => (p.id === id ? { ...p, ...props } : p)),
    })),

  removePoint: id =>
    set(s => ({
      points: s.points.filter(p => p.id !== id),
    })),

  selectObject: id => set({ selectedId: id }),
}));
