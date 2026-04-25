/**
 * Normalize Arabic text for consistent storage and comparison.
 * - Unify ة (ta marbuta) and ه at end so سراحنة / سراحنه match
 * - Unify أ إ آ to ا so احمد / أحمد match
 * - Remove diacritics (حركات): ً ٌ َ ِ ُ ْ ّ
 * - Trim and collapse spaces
 */

const ALEF_VARIANTS = /[أإآ]/g;
const TA_MARBUTA = /ة/g;
// ى (alef maksura) → ي only at end of word (مستشفى → مستشفي)
const ALEF_MAKSURA_END = /ى(?=\s|$)/g;
const TASHKEEL = /[\u064B-\u0652\u0670]/g; // ً ٌ ً َ ِ ُ ْ ّ ْ etc.
const MULTI_SPACE = /\s+/g;

/**
 * Normalize Arabic string for storage and duplicate checking.
 * Use for: teacher full_name, student full_name, any Arabic name field.
 */
export function normalizeArabic(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let s = text.trim();
  s = s.replace(ALEF_VARIANTS, 'ا');
  s = s.replace(TA_MARBUTA, 'ه'); 
  s = s.replace(ALEF_MAKSURA_END, 'ي');
  s = s.replace(TASHKEEL, '');
  s = s.replace(MULTI_SPACE, ' ').trim();
  return s;
}

/**
 * Normalize and lowercase for usernames (login / add teacher).
 * Use for: username field only.
 */
export function normalizeUsername(username: string): string {
  if (!username || typeof username !== 'string') return '';
  return username.trim().toLowerCase();
}
