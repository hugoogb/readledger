import { describe, expect, it } from "vitest";
import { parseImport } from "@/lib/import";
import { serializeCsv } from "@/lib/csv";

const HEADER =
  "series_title,volume_number,owned,read,wishlist,price_paid,store,condition,purchase_date,read_date,notes,isbn";

describe("parseImport (csv)", () => {
  it("parses a valid row", () => {
    const csv = `${HEADER}\nBerserk,1,yes,no,no,9.95,Fnac,NEW,2024-01-31,,,`;
    const { rows, errors } = parseImport(csv, "csv");

    expect(errors).toEqual([]);
    expect(rows[0]).toMatchObject({
      seriesTitle: "Berserk",
      volumeNumber: 1,
      owned: true,
      pricePaid: 9.95,
      store: "Fnac",
      condition: "NEW",
      purchaseDate: "2024-01-31",
    });
  });

  it("accepts comma decimals and DD/MM/YYYY dates from spreadsheets", () => {
    const csv = `${HEADER}\nBerserk,2,yes,no,no,"7,95",,,31/01/2024,,,`;
    const { rows, errors } = parseImport(csv, "csv");

    expect(errors).toEqual([]);
    expect(rows[0].pricePaid).toBe(7.95);
    expect(rows[0].purchaseDate).toBe("2024-01-31");
  });

  it("reports bad cells per row instead of failing the import later", () => {
    const csv = [
      HEADER,
      "Berserk,1.5,yes,no,no,,,,,,,",
      "Berserk,0,yes,no,no,,,,,,,",
      "Berserk,3,yes,no,no,abc,,,,,,",
      "Berserk,4,yes,no,no,,,,2024-02-30,,,",
    ].join("\n");
    const { rows, errors } = parseImport(csv, "csv");

    expect(rows).toEqual([]);
    expect(errors.map((e) => e.row)).toEqual([2, 3, 4, 5]);
  });

  it("round-trips cells the export escaped against formula injection", () => {
    const csv = serializeCsv(HEADER.split(","), [
      ["Berserk", "1", "yes", "no", "no", "", "", "", "", "", "- signed copy", ""],
    ]);
    const { rows } = parseImport(csv, "csv");

    expect(rows[0].notes).toBe("- signed copy");
  });
});

describe("parseImport (json)", () => {
  it("keeps series metadata from a JSON export", () => {
    const json = JSON.stringify([
      {
        title: "Berserk",
        author: "Kentaro Miura",
        status: "COMPLETED",
        publishing: false,
        totalVolumes: 41,
        retailPrice: 9.95,
        coverImage: "https://uploads.mangadex.org/covers/x/y.jpg",
        volumes: [{ volumeNumber: 1, owned: true }],
      },
    ]);
    const { rows, errors, seriesMeta } = parseImport(json, "json");

    expect(errors).toEqual([]);
    expect(rows).toHaveLength(1);
    expect(seriesMeta.Berserk).toMatchObject({
      author: "Kentaro Miura",
      status: "COMPLETED",
      totalVolumes: 41,
      retailPrice: 9.95,
    });
  });

  it("rejects a volume with no volume number instead of importing volume 0", () => {
    const json = JSON.stringify([{ title: "Berserk", volumes: [{ owned: true }] }]);
    const { rows, errors } = parseImport(json, "json");

    expect(rows).toEqual([]);
    expect(errors).toHaveLength(1);
  });

  it("drops cover URLs that next/image can't render", () => {
    const json = JSON.stringify([
      { title: "Berserk", coverImage: "https://evil.example/x.jpg", volumes: [] },
    ]);
    expect(parseImport(json, "json").seriesMeta.Berserk.coverImage).toBeNull();
  });
});
