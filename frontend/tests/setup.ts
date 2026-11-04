const canvasContext = {
  fillStyle: '',
  font: '',
  textAlign: 'start',
  textBaseline: 'alphabetic',
  strokeStyle: '',
  drawImage: () => {},
  fillText: () => {},
} as unknown as CanvasRenderingContext2D;

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value(contextId: string) {
    return contextId === '2d' ? canvasContext : null;
  },
});
