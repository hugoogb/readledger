import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Prerendered at build time, so the file read doesn't happen on the server.
export const alt = "ReadLedger, a free manga collection tracker";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "public/readledger-logo.png"));

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 80,
        color: "#f0f0f5",
        background: "linear-gradient(135deg, #0a0a0c 40%, #312e81 100%)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <img
          src={`data:image/png;base64,${logo.toString("base64")}`}
          width={88}
          height={88}
          alt=""
          // The logo is dark on transparent, so it needs a light plate here.
          style={{ borderRadius: 20, backgroundColor: "#f8f8fc", padding: 6 }}
        />
        <div style={{ fontSize: 44, fontWeight: 700 }}>ReadLedger</div>
      </div>
      <div style={{ marginTop: 48, fontSize: 80, fontWeight: 700, lineHeight: 1.1 }}>
        Your manga collection, beautifully tracked
      </div>
      <div style={{ marginTop: 32, fontSize: 34, color: "#b4b4c6" }}>
        Volumes owned, reading progress, and spending in one place
      </div>
    </div>,
    size,
  );
}
