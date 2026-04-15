/**
 * Date → 'YYYYMMDD' 문자열 (API 파라미터용)
 * @param {Date} date
 * @returns {string}
 */
export function toYYYYMMDD(date) {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * ISO / 'YYYY-MM-DD' 문자열 → 'YYYYMMDD' (API 파라미터용)
 * @param {string} iso
 * @returns {string}
 */
export function isoToApiDate(iso) {
  return iso.replace(/-/g, '');
}

/**
 * 뉴스 날짜 포맷 ('n월 n일 오전/오후 HH:MM')
 * @param {string} dateStr
 * @returns {string}
 */
export function formatNewsDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * 날짜 문자열 → 'YYYY-MM-DD' (프로필/포트폴리오 표시용)
 * @param {string} str
 * @returns {string}
 */
export function formatShortDate(str) {
  if (!str) return '-';
  if (str.includes('T')) return str.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  if (/^\d{8}$/.test(str)) return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  return str;
}
