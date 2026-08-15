import { describe, expect, it } from 'vitest';
import {
  SCENARIO_ID_RE,
  MAX_NAME_LEN,
  MAX_DESCRIPTION_LEN,
  MAX_PREVIEW_LEN,
  MAX_OPENDRIVE_LEN,
  ALLOWED_VEHICLES,
  formatApiDetail,
  ValidationIssue,
} from '../types/IScenarioTypes';

describe('IScenarioTypes', () => {
  describe('SCENARIO_ID_RE', () => {
    it('matches valid scenario IDs', () => {
      expect(SCENARIO_ID_RE.test('scenario-1')).toBe(true);
      expect(SCENARIO_ID_RE.test('test_123')).toBe(true);
      expect(SCENARIO_ID_RE.test('a')).toBe(true);
      expect(SCENARIO_ID_RE.test('a'.repeat(128))).toBe(true);
    });

    it('rejects invalid scenario IDs', () => {
      expect(SCENARIO_ID_RE.test('')).toBe(false);
      expect(SCENARIO_ID_RE.test('1abc')).toBe(true);
      expect(SCENARIO_ID_RE.test('bad id!')).toBe(false);
      expect(SCENARIO_ID_RE.test('a'.repeat(129))).toBe(false);
      expect(SCENARIO_ID_RE.test('@#$%')).toBe(false);
    });
  });

  describe('MAX constants', () => {
    it('has correct values', () => {
      expect(MAX_NAME_LEN).toBe(200);
      expect(MAX_DESCRIPTION_LEN).toBe(4000);
      expect(MAX_PREVIEW_LEN).toBe(10_000_000);
      expect(MAX_OPENDRIVE_LEN).toBe(32_000_000);
    });
  });

  describe('ALLOWED_VEHICLES', () => {
    it('contains all allowed vehicle types', () => {
      expect(ALLOWED_VEHICLES.has('car')).toBe(true);
      expect(ALLOWED_VEHICLES.has('RSU')).toBe(true);
      expect(ALLOWED_VEHICLES.has('building')).toBe(true);
      expect(ALLOWED_VEHICLES.has('pedestrian')).toBe(true);
    });

    it('does not contain disallowed vehicle types', () => {
      expect(ALLOWED_VEHICLES.has('truck')).toBe(false);
      expect(ALLOWED_VEHICLES.has('bicycle')).toBe(false);
      expect(ALLOWED_VEHICLES.has('motorcycle')).toBe(false);
    });
  });

  describe('formatApiDetail', () => {
    it('returns null for undefined detail', () => {
      expect(formatApiDetail(undefined)).toBeNull();
    });

    it('returns null for empty string detail', () => {
      expect(formatApiDetail('')).toBeNull();
    });

    it('returns null for whitespace-only string detail', () => {
      expect(formatApiDetail('   ')).toBeNull();
    });

    it('returns detail string for non-empty string detail', () => {
      expect(formatApiDetail('Error message')).toBe('Error message');
      expect(formatApiDetail('  trimmed message  ')).toBe(
        '  trimmed message  ',
      );
    });

    it('formats array of validation issues with loc and msg (body filtered out)', () => {
      const issues: ValidationIssue[] = [
        { msg: 'Required field', loc: ['body', 'name'] },
        { msg: 'Invalid value', loc: ['body', 'age'] },
      ];
      expect(formatApiDetail(issues)).toBe(
        'name: Required field; age: Invalid value',
      );
    });

    it('filters out body from loc path', () => {
      const issues: ValidationIssue[] = [
        { msg: 'Required', loc: ['body', 'scenario', 'id'] },
        { msg: 'Invalid', loc: ['body'] },
      ];
      expect(formatApiDetail(issues)).toBe('scenario.id: Required; Invalid');
    });

    it('handles numeric loc parts', () => {
      const issues: ValidationIssue[] = [
        { msg: 'Invalid item', loc: ['body', 'items', 0, 'id'] },
      ];
      expect(formatApiDetail(issues)).toBe('items.0.id: Invalid item');
    });

    it('uses default message when msg is missing', () => {
      const issues: ValidationIssue[] = [
        { loc: ['body', 'field'] },
        { loc: ['body', 'another'] },
      ];
      expect(formatApiDetail(issues)).toBe(
        'field: Validation error; another: Validation error',
      );
    });

    it('includes issues without loc with their msg', () => {
      const issues: ValidationIssue[] = [
        { msg: 'Error 1', loc: ['body', 'field1'] },
        { msg: 'Error 2' },
        { msg: 'Error 3', loc: ['body', 'field3'] },
      ];
      expect(formatApiDetail(issues)).toBe(
        'field1: Error 1; Error 2; field3: Error 3',
      );
    });

    it('includes issues with empty loc', () => {
      const issues: ValidationIssue[] = [
        { msg: 'Error 1', loc: [] },
        { msg: 'Error 2', loc: ['body', 'field2'] },
      ];
      expect(formatApiDetail(issues)).toBe('Error 1; field2: Error 2');
    });

    it('includes empty strings in result', () => {
      const issues: ValidationIssue[] = [
        { msg: '', loc: ['body', 'field1'] },
        { msg: 'Valid error', loc: ['body', 'field2'] },
        { loc: [] },
      ];
      expect(formatApiDetail(issues)).toBe(
        'field1: ; field2: Valid error; Validation error',
      );
    });

    it('returns null for empty array of issues', () => {
      expect(formatApiDetail([])).toBeNull();
    });

    it('does not filter whitespace messages', () => {
      const issues: ValidationIssue[] = [
        { msg: '', loc: [] },
        { msg: '   ', loc: ['body', 'field'] },
      ];
      expect(formatApiDetail(issues)).toBe('field:    ');
    });

    it('handles detail with only body loc', () => {
      const issues: ValidationIssue[] = [{ msg: 'Body error', loc: ['body'] }];
      expect(formatApiDetail(issues)).toBe('Body error');
    });

    it('includes all issues regardless of message content', () => {
      const issues: ValidationIssue[] = [
        { msg: 'Valid', loc: ['body', 'field1'] },
        { msg: '', loc: ['body', 'field2'] },
        { msg: 'Also valid', loc: ['body', 'field3'] },
      ];
      expect(formatApiDetail(issues)).toBe(
        'field1: Valid; field2: ; field3: Also valid',
      );
    });

    it('includes issues even when all messages are empty', () => {
      const issues: ValidationIssue[] = [
        { msg: '', loc: ['body', 'field1'] },
        { msg: '   ', loc: ['body', 'field2'] },
        { msg: '', loc: [] },
      ];
      expect(formatApiDetail(issues)).toBe('field1: ; field2:    ');
    });

    it('handles issues with mixed numeric and string loc', () => {
      const issues: ValidationIssue[] = [
        { msg: 'Error', loc: ['body', 'scenario', 1, 'path', 0, 'x'] },
      ];
      expect(formatApiDetail(issues)).toBe('scenario.1.path.0.x: Error');
    });

    it('handles issues with deep nested loc', () => {
      const issues: ValidationIssue[] = [
        { msg: 'Deep error', loc: ['body', 'level1', 'level2', 'level3'] },
      ];
      expect(formatApiDetail(issues)).toBe('level1.level2.level3: Deep error');
    });

    it('filters out body even when in the middle of loc', () => {
      const issues: ValidationIssue[] = [
        { msg: 'Error', loc: ['data', 'body', 'field'] },
      ];
      expect(formatApiDetail(issues)).toBe('data.field: Error');
    });

    it('handles detail with special characters in msg', () => {
      const issues: ValidationIssue[] = [
        { msg: 'Error with special chars: @#$%^&*()', loc: ['body', 'field'] },
      ];
      expect(formatApiDetail(issues)).toBe(
        'field: Error with special chars: @#$%^&*()',
      );
    });

    it('handles detail with long loc path', () => {
      const longLoc = [
        'body',
        'a',
        'b',
        'c',
        'd',
        'e',
        'f',
        'g',
        'h',
        'i',
        'j',
      ];
      const issues: ValidationIssue[] = [
        { msg: 'Deep nested error', loc: longLoc },
      ];
      expect(formatApiDetail(issues)).toBe(
        'a.b.c.d.e.f.g.h.i.j: Deep nested error',
      );
    });

    it('returns null for non-array non-string detail', () => {
      // @ts-expect-error - testing invalid input
      expect(formatApiDetail(null)).toBeNull();
    });
  });
});
