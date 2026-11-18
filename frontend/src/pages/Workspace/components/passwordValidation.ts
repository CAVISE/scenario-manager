export function hasValidPasswordLength(value: string, minimum: 1 | 12) {
  // Match Pydantic's Unicode code-point count, not HTML's UTF-16 length.
  const length = Array.from(value).length;
  return length >= minimum && length <= 256;
}
