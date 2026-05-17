import crypto from "crypto";

/**
 * Generates a secure SHA-256 hash of a password string.
 */
export function hashPassword(password: string): string {
  return crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");
}
