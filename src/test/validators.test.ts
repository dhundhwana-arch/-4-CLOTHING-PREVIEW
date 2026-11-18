import { describe, expect, it } from 'vitest';
import { isSupportedOption, isValidHexColor, normalizeHexColor } from '../core/validation/validators';

describe('validators', () => {
  describe('isValidHexColor', () => {
    it('accepts #rrggbb', () => {
      expect(isValidHexColor('#a1B2c3')).toBe(true);
    });
    it('accepts #rgb shorthand', () => {
      expect(isValidHexColor('#abc')).toBe(true);
    });
    it('rejects missing hash, bad length, non-hex, non-strings', () => {
      expect(isValidHexColor('a1b2c3')).toBe(false);
      expect(isValidHexColor('#abcd')).toBe(false);
      expect(isValidHexColor('#xyzxyz')).toBe(false);
      expect(isValidHexColor(123)).toBe(false);
      expect(isValidHexColor(undefined)).toBe(false);
    });
  });

  describe('normalizeHexColor', () => {
    it('expands shorthand and lowercases', () => {
      expect(normalizeHexColor('#ABC')).toBe('#aabbcc');
      expect(normalizeHexColor(' #FF8800 ')).toBe('#ff8800');
    });
    it('returns null for invalid input', () => {
      expect(normalizeHexColor('red')).toBeNull();
      expect(normalizeHexColor(null)).toBeNull();
    });
  });

  describe('isSupportedOption', () => {
    it('matches membership strictly', () => {
      expect(isSupportedOption('classic', ['classic', 'spread'] as const)).toBe(true);
      expect(isSupportedOption('Classic', ['classic'] as const)).toBe(false);
      expect(isSupportedOption(7, ['classic'] as const)).toBe(false);
    });
  });
});
