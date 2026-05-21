// Unit tests for the rail diagnostics module value formatting.
import { describe, it, expect } from 'vitest';
import { _internal } from './rail.js';

const { formatValue, labelFor } = _internal;

describe('formatValue', () => {
  it('passes strings through unchanged', () => {
    expect(formatValue('frozen', 'float')).toBe('frozen');
  });
  it("formats 'int' with no decimals", () => {
    expect(formatValue(42.7, 'int')).toBe('43');
  });
  it("formats 'sci' in exponential with 2 digits", () => {
    expect(formatValue(0.00123, 'sci')).toBe('1.23e-3');
  });
  it("formats 'percent'", () => {
    expect(formatValue(0.4567, 'percent')).toBe('45.7%');
  });
  it("formats 'fixed-3'", () => {
    expect(formatValue(1.23456, 'fixed-3')).toBe('1.235');
  });
  it('defaults to 3 significant figures', () => {
    expect(formatValue(123.456, undefined)).toBe('123');
    expect(formatValue(0.0123456, 'float')).toBe('0.0123');
  });
  it('renders negative zero as 0', () => {
    expect(formatValue(-0, 'int')).toBe('0');
    expect(formatValue(-0.0001, 'int')).toBe('0');
  });
  it('passes non-finite values through as strings', () => {
    expect(formatValue(Infinity, 'float')).toBe('Infinity');
    expect(formatValue(NaN, 'float')).toBe('NaN');
  });
});

describe('labelFor', () => {
  it('uses an explicit label when present', () => {
    expect(labelFor({ key: 'm', label: 'Magnetization' })).toBe('Magnetization');
  });
  it('humanizes the key when no label is given', () => {
    expect(labelFor({ key: 'energy_per_site' })).toBe('energy per site');
  });
});
