import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "ReadLedger, a free book collection tracker";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#f6f2e9";
const INK = "#1d1b18";
const MUTED = "#6f675b";

export default async function OpengraphImage() {
  const [mark, serif] = await Promise.all([
    readFile(join(process.cwd(), "app/icon.svg")),
    readFile(join(process.cwd(), "app/fonts/newsreader-500.woff")),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 96px",
        color: INK,
        background: PAPER,
        fontFamily: "Newsreader",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <img
          src={`data:image/svg+xml;base64,${mark.toString("base64")}`}
          width={72}
          height={72}
          alt=""
        />
        <div style={{ fontSize: 48 }}>ReadLedger</div>
      </div>
      <div style={{ marginTop: 56, fontSize: 84, lineHeight: 1.05, letterSpacing: -2 }}>
        A ledger for every book on your shelf.
      </div>
      <div
        style={{
          marginTop: 40,
          width: 520,
          height: 11,
          borderTop: `3px solid ${INK}`,
          borderBottom: `3px solid ${INK}`,
        }}
      />
      <div style={{ marginTop: 32, fontSize: 32, color: MUTED }}>
        Novels, manga and comics: what you own, read and spent
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: "Newsreader", data: serif, weight: 500, style: "normal" }],
    },
  );
}
