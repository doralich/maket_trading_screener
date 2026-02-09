import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver;

// Mock Xterm
vi.mock('xterm', () => {
  return {
    Terminal: vi.fn().mockImplementation(function() {
      return {
        open: vi.fn(),
        loadAddon: vi.fn(),
        writeln: vi.fn(),
        dispose: vi.fn(),
      };
    }),
  };
});

vi.mock('xterm-addon-fit', () => {
  return {
    FitAddon: vi.fn().mockImplementation(function() {
      return {
        fit: vi.fn(),
      };
    }),
  };
});

// Mock react-use-websocket
vi.mock('react-use-websocket', () => {
  return {
    default: vi.fn().mockReturnValue({
      lastJsonMessage: null,
      readyState: 3, // OFFLINE
      sendJsonMessage: vi.fn(),
    }),
  };
});
