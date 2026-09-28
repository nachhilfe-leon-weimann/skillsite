"use client";

import { QRCodeSVG } from "qrcode.react";

import { brandColors } from "@skillsite/ui/tokens/colors";

/** WhatsApp QR for desktop visitors. High-contrast for reliable scanning. */
export function WhatsappQr({ value }: { value: string }) {
  return (
    <div className="rounded-2xl bg-white p-3">
      <QRCodeSVG
        value={value}
        size={132}
        bgColor={brandColors.surface}
        fgColor={brandColors.navy}
      />
    </div>
  );
}
