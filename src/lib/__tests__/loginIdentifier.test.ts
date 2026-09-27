import { describe, expect, it } from 'vitest';
import { normalizeLoginIdentifier } from '../loginIdentifier';

describe('normalizeLoginIdentifier', () => {
  it('trims and lowercases email identifiers', () => {
    expect(normalizeLoginIdentifier('  Maria@Fazenda.com.br ')).toEqual({
      type: 'email',
      value: 'maria@fazenda.com.br',
    });
  });

  it('rejects malformed email identifiers', () => {
    expect(normalizeLoginIdentifier('not-an-email@').type).toBe('invalid');
  });

  it('trims and lowercases valid usernames', () => {
    expect(normalizeLoginIdentifier('  Paraiba_Agro.1 ')).toEqual({
      type: 'username',
      value: 'paraiba_agro.1',
    });
  });

  it.each(['', '  ', 'ab', 'a'.repeat(31), 'nome com espaço', 'nome!'])('%s is rejected', (input) => {
    expect(normalizeLoginIdentifier(input).type).toBe('invalid');
  });
});
