import { AsyncKeycapGenerator } from './AsyncKeycapGenerator';

/**
 * Shared singleton AsyncKeycapGenerator instance used by both the preview
 * canvas and the STL export flow.
 */
export const asyncGenerator = new AsyncKeycapGenerator();
