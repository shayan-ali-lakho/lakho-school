import { randomInt } from "node:crypto";

// No 0/O, 1/l/I: easier to read out or write down when handing over a login.
const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** A random 10-character password for handing to a new user. */
export function generatePassword(length = 10): string {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}
