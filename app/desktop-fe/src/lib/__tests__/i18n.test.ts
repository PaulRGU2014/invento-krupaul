import { describe, expect, it } from 'vitest';
import { deepMerge } from '../i18n';

describe('deepMerge', () => {
  it('merges nested objects without mutating inputs', () => {
    const a = { foo: { bar: 'one' }, keep: 'yes' } as const;
    const b = { foo: { baz: 'two' }, newKey: 'added' } as const;

    const result = deepMerge(a, b);

    expect(result).toEqual({ foo: { bar: 'one', baz: 'two' }, keep: 'yes', newKey: 'added' });
    expect(a).toEqual({ foo: { bar: 'one' }, keep: 'yes' });
    expect(b).toEqual({ foo: { baz: 'two' }, newKey: 'added' });
  });

  it('overrides primitive values from source', () => {
    const a = { foo: 'base', num: 1 } as const;
    const b = { foo: 'override', other: true } as const;

    const result = deepMerge(a, b);

    expect(result).toEqual({ foo: 'override', num: 1, other: true });
  });
});
