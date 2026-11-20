"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeRegex = escapeRegex;
exports.safeCaseInsensitiveRegex = safeCaseInsensitiveRegex;
/**
 * Escapes characters with special meaning in regular expressions:
 * . * + ? ^ $ { } ( ) | [ ] \
 * Prevents regex injection and failure on usernames containing symbols like $.
 */
function escapeRegex(text) {
    return String(text ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
/**
 * Creates a case-insensitive exact-match RegExp for a given string,
 * safely escaping all special regex characters.
 */
function safeCaseInsensitiveRegex(text) {
    return new RegExp("^" + escapeRegex(String(text).trim()) + "$", "i");
}
