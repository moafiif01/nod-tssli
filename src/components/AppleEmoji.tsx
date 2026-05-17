"use client";

import React from "react";
import { hexToEmoji } from "@/lib/emoji";

const getAppleEmojiUrl = (hex: string) =>
  `https://raw.githubusercontent.com/iamcal/emoji-data/master/img-apple-64/${hex}.png`;

type Props = {
  hex: string;
  size?: string | number;
  className?: string;
  alt?: string;
  useImg?: boolean; // when false, fall back to native emoji
  style?: React.CSSProperties;
};

export default function AppleEmoji({ hex, size = "1em", className = "", alt = "", useImg = true, style = {} }: Props) {
  const emoji = hexToEmoji(hex);
  if (useImg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={getAppleEmojiUrl(hex)}
        alt={alt || emoji}
        className={className}
        style={{ width: size, height: size, display: "inline-block", lineHeight: 0, ...style }}
      />
    );
  }

  return (
    <span className={className} style={{ fontSize: size, lineHeight: 1, ...style }}>
      {emoji}
    </span>
  );
}
