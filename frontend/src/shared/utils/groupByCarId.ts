export function groupByCarId<T extends { carId: string }>(
  items: T[]
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const item of items) {
    const bucket = grouped.get(item.carId);
    if (bucket) {
      bucket.push(item);
    } else {
      grouped.set(item.carId, [item]);
    }
  }
  return grouped;
}

export function getGroupedByCarId<T>(
  grouped: Map<string, T[]>,
  carId: string
): T[] {
  return grouped.get(carId) ?? [];
}
