import type { EdgeContext } from '@edge-runtime/vm';
import { noop } from 'es-toolkit/function';
import type { Simplify } from 'type-fest';
import { vi } from 'vitest';

type ConsoleLevel = Simplify<keyof EdgeContext['console']>;

/**
 * Temporarily suppresses console output for the given level(s) while executing
 * a callback. The console mocks are always restored after the callback
 * completes, even if it throws.
 *
 * @param level - A single console level or an array of levels to suppress.
 * @param callback - The function to execute while console output is suppressed.
 * @returns The return value of the callback.
 */
export async function suppressConsole<T>(
  level: ConsoleLevel | ConsoleLevel[],
  callback: () => T | Promise<T>,
): Promise<T> {
  const levels = Array.isArray(level) ? level : [level];
  const mocks = levels.map((l) =>
    vi.spyOn(console, l).mockImplementation(noop),
  );
  try {
    return await callback();
  } finally {
    for (const mock of mocks) mock.mockRestore();
  }
}
