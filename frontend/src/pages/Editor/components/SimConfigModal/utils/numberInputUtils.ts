export function parseNumberInputChange(
  input: HTMLInputElement | HTMLTextAreaElement
): number | undefined {
  if ('value' in input && input.value === '') {
    return undefined;
  }

  if ('valueAsNumber' in input && Number.isFinite(input.valueAsNumber)) {
    return input.valueAsNumber;
  }

  const value = 'value' in input ? input.value : '';
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
