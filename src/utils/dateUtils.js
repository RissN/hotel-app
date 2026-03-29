/**
 * Returns a date string in YYYY-MM-DD format based on local time.
 * @param {Date} date - Optional Date object. Defaults to now.
 * @returns {string} - Date string in YYYY-MM-DD format.
 */
export const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Returns a date string for yesterday in YYYY-MM-DD format based on local time.
 * @returns {string} - Date string in YYYY-MM-DD format.
 */
export const getYesterdayDateString = () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return getLocalDateString(date);
};
