export const DATE_PRESETS = ['Custom', 'Today', 'Yesterday', 'This week', 'Last 7 days', 'Last week', 'Last 14 days', 'This month', 'Last 30 days', 'Last month', 'All time'];
export const ALL_TIME = { preset: 'All time', start: '', end: '' };
export function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function parseDay(value) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
}
export function presetRange(preset, now = new Date()) {
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(end);
    switch (preset) {
        case 'All time': return { ...ALL_TIME };
        case 'Yesterday': start.setDate(start.getDate() - 1); end.setDate(end.getDate() - 1); break;
        case 'This week': start.setDate(start.getDate() - (start.getDay() + 6) % 7); break;
        case 'Last week': start.setDate(start.getDate() - (start.getDay() + 6) % 7 - 7); end.setTime(start.getTime()); end.setDate(end.getDate() + 6); break;
        case 'Last 7 days': start.setDate(start.getDate() - 6); break;
        case 'Last 14 days': start.setDate(start.getDate() - 13); break;
        case 'Last 30 days': start.setDate(start.getDate() - 29); break;
        case 'This month': start.setDate(1); break;
        case 'Last month': start.setDate(1); start.setMonth(start.getMonth() - 1); end.setDate(0); break;
    }
    return { preset, start: dateKey(start), end: dateKey(end) };
}
// Send local midnight boundaries as UTC instants; the exclusive end includes the whole final day.
export function rangeParams(range) {
    if (!range.start || !range.end) return {};
    const end = parseDay(range.end);
    end.setDate(end.getDate() + 1);
    return { startDate: parseDay(range.start).toISOString(), endDate: end.toISOString() };
}
export function inDateRange(value, range) {
    if (!range.start || !range.end) return true;
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && dateKey(date) >= range.start && dateKey(date) <= range.end;
}
