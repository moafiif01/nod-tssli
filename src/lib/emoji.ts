// Convert hex or hex-sequence strings (e.g. "1f525" or "2600-fe0f") to native emoji
export function hexSequenceToEmoji(seq: string) {
  if (!seq) return "";
  return seq
    .split(/[-_]/)
    .map((s) => Number.parseInt(s, 16))
    .filter((n) => !Number.isNaN(n))
    .map((cp) => String.fromCodePoint(cp))
    .join("");
}

export const hexToEmoji = hexSequenceToEmoji;
