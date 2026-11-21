import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const resolveIsbnVolume = vi.fn();
const markVolumeOwnedByIsbn = vi.fn();
const listMultiVolumeSeries = vi.fn();

vi.mock("@/actions/isbn-volume", () => ({
  resolveIsbnVolume: (...args: unknown[]) => resolveIsbnVolume(...args),
  markVolumeOwnedByIsbn: (...args: unknown[]) => markVolumeOwnedByIsbn(...args),
  listMultiVolumeSeries: (...args: unknown[]) => listMultiVolumeSeries(...args),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { VolumeMatchCard } from "@/components/series/volume-match-card";

const ISBN = "9788468471549";
const existing = (owned: boolean) => ({
  ok: true,
  data: { kind: "existing", seriesId: "s1", seriesTitle: "One Piece", volumeNumber: 3, owned, isbn: ISBN },
});

beforeEach(() => vi.clearAllMocks());

async function renderCard(props: Partial<Parameters<typeof VolumeMatchCard>[0]> = {}) {
  const onStartNewSeries = vi.fn();
  const onDone = vi.fn();
  await act(async () => {
    render(<VolumeMatchCard isbn={ISBN} onStartNewSeries={onStartNewSeries} onDone={onDone} {...props} />);
  });
  return { onStartNewSeries, onDone };
}

describe("VolumeMatchCard", () => {
  it("offers to mark an existing volume and calls the action with the stepped number", async () => {
    resolveIsbnVolume.mockResolvedValue(existing(false));
    markVolumeOwnedByIsbn.mockResolvedValue({ ok: true, data: undefined });
    const { onDone } = await renderCard();

    expect(screen.getByText(/One Piece/)).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /next volume/i })));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /mark as owned/i })));

    expect(markVolumeOwnedByIsbn).toHaveBeenCalledWith("s1", 4, ISBN);
    expect(onDone).toHaveBeenCalled();
  });

  it("files the volume under another series picked by the user", async () => {
    resolveIsbnVolume.mockResolvedValue(existing(false));
    markVolumeOwnedByIsbn.mockResolvedValue({ ok: true, data: undefined });
    listMultiVolumeSeries.mockResolvedValue({
      ok: true,
      data: [
        { id: "s1", title: "One Piece", totalVolumes: 110 },
        { id: "s2", title: "One Piece (Edición 3 en 1)", totalVolumes: 36 },
      ],
    });
    await renderCard();

    await act(async () => fireEvent.click(screen.getByRole("button", { name: /change series/i })));
    await act(async () => fireEvent.change(screen.getByRole("combobox"), { target: { value: "s2" } }));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /mark as owned/i })));

    expect(markVolumeOwnedByIsbn).toHaveBeenCalledWith("s2", 3, ISBN);
  });

  it("shows already-owned copy without a button", async () => {
    resolveIsbnVolume.mockResolvedValue(existing(true));
    await renderCard();

    expect(screen.getByText(/already in your library/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /mark as owned/i })).toBeNull();
  });

  it("hands a new-series match to onStartNewSeries", async () => {
    const match = {
      kind: "new",
      manga: { mangadexId: "md-1", title: "Dr. Slump" },
      volumeNumber: 11,
      totalVolumes: 15,
      useMangadexCovers: false,
      isbn: ISBN,
    };
    resolveIsbnVolume.mockResolvedValue({ ok: true, data: match });
    const { onStartNewSeries } = await renderCard();

    expect(screen.getByText(/15 vols/)).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /add series/i })));

    expect(onStartNewSeries).toHaveBeenCalledWith(match, 11);
  });

  it("renders nothing when the resolver returns null", async () => {
    resolveIsbnVolume.mockResolvedValue({ ok: true, data: null });
    await renderCard();
    expect(screen.queryByRole("region")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
