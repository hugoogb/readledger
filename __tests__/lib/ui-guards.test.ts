import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Guards the redesign: these are the tells of the old, template look, and
// emoji or unicode symbols standing in for icons.
const ROOTS = ["app", "components"];
const BANNED: [string, RegExp][] = [
  ["emoji or symbol used as an icon", /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}]/u],
  ["glass surface", /\bglass\b/],
  ["gradient text", /gradient-text/],
  ["glow card", /stats-glow|pulse-glow/],
  ["blurred blob", /blur-3xl|blur-\[100px\]/],
  ["Sparkles icon", /\bSparkles\b/],
  ["oversized radius", /rounded-(?:2xl|3xl)\b/],
  ["accent glow shadow", /shadow-accent/],
  ["old logo image", /readledger-logo/],
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(tsx?|css)$/.test(name) ? [path] : [];
  });
}

const files = ROOTS.flatMap(sourceFiles);

describe("UI guards", () => {
  it.each(BANNED)("has no %s", (_, pattern) => {
    const offenders = files.flatMap((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .flatMap((line, i) => (pattern.test(line) ? [`${file}:${i + 1}: ${line.trim()}`] : [])),
    );
    expect(offenders).toEqual([]);
  });

  it("keeps chart colours on the palette variables", () => {
    const offenders = files
      .filter((file) => file.startsWith(join("components", "charts")))
      .flatMap((file) =>
        readFileSync(file, "utf8")
          .split("\n")
          .flatMap((line, i) => (/#[0-9a-fA-F]{3,6}\b/.test(line) ? [`${file}:${i + 1}`] : [])),
      );
    expect(offenders).toEqual([]);
  });
});
