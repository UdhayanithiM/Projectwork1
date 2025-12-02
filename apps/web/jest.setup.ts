import '@testing-library/jest-dom';

// Polyfill TextEncoder / TextDecoder
import { TextEncoder, TextDecoder } from 'util';
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

// ✅ Polyfill ReadableStream (needed for next-test-api-route-handler in Node)
if (typeof (global as any).ReadableStream === 'undefined') {
  const { ReadableStream } = require('web-streams-polyfill');
  (global as any).ReadableStream = ReadableStream;
}

// ✅ Only load browser-specific polyfills if running in jsdom
if (typeof window !== 'undefined') {
  require('whatwg-fetch'); // only patch fetch in browser env

  const IntersectionObserverMock = () => ({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.IntersectionObserver = jest.fn().mockImplementation(IntersectionObserverMock);

  const ResizeObserverMock = () => ({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.ResizeObserver = jest.fn().mockImplementation(ResizeObserverMock);
}

