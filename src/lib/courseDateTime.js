// Course timestamps are instants; the public schedule always uses Taiwan time.
const COURSE_TIME_ZONE = 'Asia/Taipei';
const taiwanFormatter = (options) =>
    new Intl.DateTimeFormat('zh-TW', { ...options, timeZone: COURSE_TIME_ZONE });

const dateFormatter = taiwanFormatter({
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
});
const timeFormatter = taiwanFormatter({ hour: '2-digit', minute: '2-digit' });
const confirmationFormatter = taiwanFormatter({
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
});
const notificationFormatter = taiwanFormatter();
const galleryFormatter = taiwanFormatter({ month: 'long', day: 'numeric' });
const dayFormatter = taiwanFormatter({ year: 'numeric', month: '2-digit', day: '2-digit' });

export function formatCourseDate(value) {
    const date = new Date(value);
    return { date: dateFormatter.format(date), time: timeFormatter.format(date) };
}

export function formatCourseConfirmation(value) {
    return confirmationFormatter.format(new Date(value));
}

export function formatCourseNotificationDate(value) {
    return notificationFormatter.format(new Date(value));
}

export function formatCourseGalleryDate(value) {
    return galleryFormatter.format(new Date(value));
}

export function courseDayKey(value) {
    const parts = Object.fromEntries(dayFormatter.formatToParts(new Date(value))
        .map(({ type, value }) => [type, value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
}
