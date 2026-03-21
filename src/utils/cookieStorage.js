/**
 * Custom Cookie Storage Adapter untuk Supabase Auth
 * 
 * Menggantikan localStorage dengan cookies untuk keamanan yang lebih baik.
 * Cookies di-set dengan atribut: Secure, SameSite=Lax, path=/
 */

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 hari dalam detik

/**
 * Mengambil value cookie berdasarkan nama/key
 */
function getItem(key) {
    const cookies = document.cookie.split('; ');
    for (const cookie of cookies) {
        // Gunakan indexOf untuk handle value yang mengandung '='
        const eqIndex = cookie.indexOf('=');
        if (eqIndex === -1) continue;

        const name = decodeURIComponent(cookie.substring(0, eqIndex));
        if (name === key) {
            return decodeURIComponent(cookie.substring(eqIndex + 1));
        }
    }
    return null;
}

/**
 * Menyimpan value ke cookie dengan atribut keamanan
 */
function setItem(key, value) {
    const isSecure = window.location.protocol === 'https:';
    let cookieStr = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    cookieStr += `; path=/`;
    cookieStr += `; max-age=${COOKIE_MAX_AGE}`;
    cookieStr += `; SameSite=Lax`;
    if (isSecure) {
        cookieStr += `; Secure`;
    }
    document.cookie = cookieStr;
}

/**
 * Menghapus cookie dengan meng-set max-age ke 0
 */
function removeItem(key) {
    const isSecure = window.location.protocol === 'https:';
    let cookieStr = `${encodeURIComponent(key)}=; path=/; max-age=0; SameSite=Lax`;
    if (isSecure) {
        cookieStr += `; Secure`;
    }
    document.cookie = cookieStr;
}

export const cookieStorage = {
    getItem,
    setItem,
    removeItem,
};
