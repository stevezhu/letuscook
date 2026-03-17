import { Validator, VOptional, v, OptionalProperty } from 'convex/values';

/**
 * Same as `pick` from `convex-helpers` but makes the values optional.
 * @param obj - The object to pick from.
 * @param keys - The keys to pick from the object.
 * @returns A new object with only the keys you picked and their values.
 */
export function pickOptional<
  T extends Record<string, Validator<unknown, OptionalProperty, string>>,
  Keys extends (keyof T)[],
>(obj: T, keys: Keys) {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([k]) => keys.includes(k as Keys[number]))
      .map(([k, val]) => [k, v.optional(val)]),
  ) as {
    [K in Keys[number]]: VOptional<T[K]>;
  };
}
