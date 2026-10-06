import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL_TIME, presetRange, rangeParams, inDateRange } from '../src/utils/dateRange.js';

test('presets use inclusive local dates and Monday-based weeks', () => {
    const now = new Date(2026, 9, 1, 21);
    const expected = {
        Today: ['2026-10-01', '2026-10-01'], Yesterday: ['2026-09-30', '2026-09-30'],
        'This week': ['2026-09-28', '2026-10-01'], 'Last week': ['2026-09-21', '2026-09-27'],
        'Last 7 days': ['2026-09-25', '2026-10-01'], 'Last 14 days': ['2026-09-18', '2026-10-01'],
        'This month': ['2026-10-01', '2026-10-01'], 'Last 30 days': ['2026-09-02', '2026-10-01'],
        'Last month': ['2026-09-01', '2026-09-30']
    };
    for (const [preset, [start, end]] of Object.entries(expected)) assert.deepEqual(presetRange(preset, now), { preset, start, end });
    assert.deepEqual(presetRange('All time', now), ALL_TIME);
    assert.equal(presetRange('Last month', new Date(2024, 2, 1)).end, '2024-02-29');
    assert.equal(presetRange('Last month', new Date(2026, 0, 1)).start, '2025-12-01');
});

test('range includes the entire end date and excludes adjacent days', () => {
    const range = presetRange('Today', new Date(2026, 9, 1));
    assert.equal(inDateRange(new Date(2026, 9, 1, 0), range), true);
    assert.equal(inDateRange(new Date(2026, 9, 1, 23, 59, 59, 999), range), true);
    assert.equal(inDateRange(new Date(2026, 9, 2), range), false);
    assert.equal(inDateRange(new Date(2026, 8, 30, 23, 59), range), false);
    assert.equal(inDateRange('bad-date', range), false);
    assert.deepEqual(rangeParams(range), { startDate: new Date(2026, 9, 1).toISOString(), endDate: new Date(2026, 9, 2).toISOString() });
    assert.deepEqual(rangeParams(ALL_TIME), {});
});
