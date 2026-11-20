/**
 * Escapes characters with special meaning in regular expressions:
 * . * + ? ^ $ { } ( ) | [ ] \
 * Prevents regex injection and failure on usernames containing symbols like $.
 */
export function escapeRegex(text: string): string {
  return String(text ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Creates a case-insensitive exact-match RegExp for a given string,
 * safely escaping all special regex characters.
 */
export function safeCaseInsensitiveRegex(text: string): RegExp {
  return new RegExp("^" + escapeRegex(String(text).trim()) + "$", "i");
}
