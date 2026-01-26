/**
 * Resolves the correct URL for an image, accounting for the base path (GitHub Pages).
 * @param {string} path - The absolute path to the image (e.g., "/image.png")
 * @returns {string} - The resolved URL
 */
export const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path; // External URLs

    const baseUrl = import.meta.env.BASE_URL;

    // Remove leading slash from path if it exists, to avoid double slashes if BASE_URL ends with /
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    // baseUrl usually ends with /, so we can just append
    return `${baseUrl}${cleanPath}`;
};
