import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn();

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});
