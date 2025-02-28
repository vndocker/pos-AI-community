/**
 * Creates a mock implementation of window.matchMedia for testing responsive designs
 * @param {number} width - The viewport width to simulate
 * @returns {function} - A mock implementation of window.matchMedia
 */
export function createMatchMedia(width) {
  return (query) => ({
    matches: query.includes(`(min-width: ${width}px)`) || 
             (query.includes('min-width') && 
              Number(query.match(/\d+/)?.[0] || 0) <= width) ||
             (query.includes('max-width') && 
              Number(query.match(/\d+/)?.[0] || 0) >= width),
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  });
}

/**
 * Custom render function that includes common providers
 * Can be extended as needed for more complex test scenarios
 */
export function renderWithProviders(ui, options = {}) {
  return {
    ...render(ui, options),
  };
}
