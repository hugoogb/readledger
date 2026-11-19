import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VolumeWithStore } from "@/types";

const updateVolume = vi.fn();
const toggleVolumeRead = vi.fn();
const toggleWishlist = vi.fn();

vi.mock("@/actions/volumes", () => ({
  updateVolume: (...args: unknown[]) => updateVolume(...args),
  toggleVolumeRead: (...args: unknown[]) => toggleVolumeRead(...args),
}));
vi.mock("@/actions/wishlist", () => ({
  toggleWishlist: (...args: unknown[]) => toggleWishlist(...args),
}));
vi.mock("@/actions/stores", () => ({ createStore: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { BookPanel } from "@/components/books/book-panel";

const now = new Date("2026-03-01T00:00:00Z");

function makeBook(overrides: Partial<VolumeWithStore> = {}): VolumeWithStore {
  return {
    id: "vol-1",
    seriesId: "s-1",
    volumeNumber: 1,
    owned: false,
    read: false,
    wishlist: false,
    pricePaid: null,
    condition: null,
    purchaseDate: null,
    readDate: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
    isbn: null,
    coverImage: null,
    title: null,
    storeId: null,
    store: null,
    ...overrides,
  };
}

// Server actions that never settle, so taps land while the first is pending.
const pending = () => new Promise(() => {});

beforeEach(() => vi.clearAllMocks());

describe("BookPanel", () => {
  it("sends the opposite of what the button shows when tapped twice quickly", async () => {
    updateVolume.mockImplementation(pending);
    render(<BookPanel volume={makeBook()} title="Dune" retailPrice={null} stores={[]} />);

    await act(async () => fireEvent.click(screen.getByRole("button", { name: /not owned/i })));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /^owned$/i })));

    expect(updateVolume).toHaveBeenCalledTimes(2);
    expect(updateVolume.mock.calls[0][1]).toMatchObject({ owned: true });
    expect(updateVolume.mock.calls[1][1]).toMatchObject({ owned: false });
  });
});
