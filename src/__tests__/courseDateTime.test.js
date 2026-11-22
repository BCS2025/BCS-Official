import { describe, expect, it } from 'vitest';
import {
    courseDayKey,
    formatCourseConfirmation,
    formatCourseDate,
    formatCourseGalleryDate,
    formatCourseNotificationDate,
} from '../lib/courseDateTime.js';

describe('public course dates use Taiwan time', () => {
    it('shows the Nov 28 lamp workshop at 3:30 pm in list, detail and confirmation', () => {
        const date = '2026-11-28T07:30:00Z';
        const formatted = formatCourseDate(date);
        expect(formatted.date.replace(/\s/g, '')).toBe('2026年11月28日週六');
        expect(formatted.time).toBe('下午03:30');
        expect(formatCourseConfirmation(date)).toContain('11月28日');
        expect(formatCourseConfirmation(date)).toContain('下午03:30');
    });

    it.each([
        ['2026-11-27T17:30:00Z', '2026-11-28', '11月28日', '2026/11/28'],
        ['2026-11-30T17:30:00Z', '2026-12-01', '12月1日', '2026/12/1'],
        ['2026-12-31T17:30:00Z', '2027-01-01', '1月1日', '2027/1/1'],
    ])('uses the Taiwan civil date for %s', (date, key, label, notification) => {
        expect(courseDayKey(date)).toBe(key);
        expect(formatCourseGalleryDate(date)).toBe(label);
        expect(formatCourseDate(date).date).toContain(label);
        expect(formatCourseConfirmation(date)).toContain(label);
        expect(formatCourseConfirmation(date)).toContain('上午01:30');
        expect(formatCourseNotificationDate(date)).toBe(notification);
    });

    it('treats equivalent offset timestamps the same', () => {
        expect(formatCourseDate('2026-11-28T15:30:00+08:00'))
            .toEqual(formatCourseDate('2026-11-28T07:30:00Z'));
    });
});
