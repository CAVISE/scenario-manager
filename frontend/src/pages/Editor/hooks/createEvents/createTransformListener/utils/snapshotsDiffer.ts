export function snapshotsDiffer(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): boolean {
  return Object.keys(a).some((key) => a[key] !== b[key]);
}
