type EntityWithId = {
  id: string;
};

export function updateById<T extends EntityWithId>(
  entities: T[],
  id: string,
  patch: Partial<T>
): T[] {
  return entities.map((entity) =>
    entity.id === id ? { ...entity, ...patch } : entity
  );
}

export function removeById<T extends EntityWithId>(
  entities: T[],
  id: string
): T[] {
  return entities.filter((entity) => entity.id !== id);
}

export function removeByIndex<T>(entities: T[], index: number): T[] {
  return entities.filter((_, entityIndex) => entityIndex !== index);
}
