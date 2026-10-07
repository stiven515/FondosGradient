import '@testing-library/jest-dom'

// jsdom has no canvas: say so explicitly instead of logging a "not implemented" error per call.
HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext']

// jsdom has neither observer. Tests that need to drive them install their own; these keep everything else rendering.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
}
globalThis.IntersectionObserver ??= NoopObserver as unknown as typeof IntersectionObserver
globalThis.ResizeObserver ??= NoopObserver as unknown as typeof ResizeObserver
