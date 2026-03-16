import { describe, it, expect } from "vitest";
import { serializeCsv, parseCsv } from "@/lib/csv";

describe("serializeCsv", () => {
  it("serializes basic data", () => {
    const result = serializeCsv(["name", "value"], [["foo", "bar"]]);
    expect(result).toBe("name,value\nfoo,bar");
  });

  it("escapes fields with commas", () => {
    const result = serializeCsv(["name"], [["hello, world"]]);
    expect(result).toBe('name\n"hello, world"');
  });

  it("escapes fields with quotes", () => {
    const result = serializeCsv(["name"], [['say "hi"']]);
    expect(result).toBe('name\n"say ""hi"""');
  });

  it("escapes fields with newlines", () => {
    const result = serializeCsv(["name"], [["line1\nline2"]]);
    expect(result).toBe('name\n"line1\nline2"');
  });

  it("prevents CSV formula injection with = prefix", () => {
    const result = serializeCsv(["name"], [["=CMD()"]]);
    expect(result).toBe("name\n'=CMD()");
  });

  it("prevents CSV formula injection with + prefix", () => {
    const result = serializeCsv(["name"], [["+1+2"]]);
    expect(result).toBe("name\n'+1+2");
  });

  it("prevents CSV formula injection with - prefix", () => {
    const result = serializeCsv(["name"], [["-1-2"]]);
    expect(result).toBe("name\n'-1-2");
  });

  it("prevents CSV formula injection with @ prefix", () => {
    const result = serializeCsv(["name"], [["@SUM(A1)"]]);
    expect(result).toBe("name\n'@SUM(A1)");
  });

  it("handles empty data", () => {
    const result = serializeCsv(["a", "b"], []);
    expect(result).toBe("a,b");
  });
});

describe("parseCsv", () => {
  it("parses basic CSV", () => {
    const result = parseCsv("name,value\nfoo,bar");
    expect(result.headers).toEqual(["name", "value"]);
    expect(result.rows).toEqual([["foo", "bar"]]);
  });

  it("handles quoted fields", () => {
    const result = parseCsv('name\n"hello, world"');
    expect(result.rows[0][0]).toBe("hello, world");
  });

  it("handles escaped quotes", () => {
    const result = parseCsv('name\n"say ""hi"""');
    expect(result.rows[0][0]).toBe('say "hi"');
  });

  it("handles newlines within quotes", () => {
    const result = parseCsv('name\n"line1\nline2"');
    expect(result.rows[0][0]).toBe("line1\nline2");
  });

  it("handles empty input", () => {
    const result = parseCsv("");
    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
  });

  it("handles CRLF line endings", () => {
    const result = parseCsv("a,b\r\n1,2\r\n3,4");
    expect(result.rows).toEqual([["1", "2"], ["3", "4"]]);
  });

  it("skips empty rows", () => {
    const result = parseCsv("a\n1\n\n2");
    expect(result.rows).toEqual([["1"], ["2"]]);
  });

  it("roundtrips with serializeCsv", () => {
    const headers = ["title", "author"];
    const rows = [["My Book", "John"], ["Another, Book", 'With "quotes"']];
    const csv = serializeCsv(headers, rows);
    const parsed = parseCsv(csv);
    expect(parsed.headers).toEqual(headers);
    expect(parsed.rows).toEqual(rows);
  });
});
