import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/actions/publishers", () => ({
  createPublisher: vi.fn(async (name: string) => ({ ok: true, data: { id: "p-new", name } })),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { SeriesFormFields } from "@/components/series/series-form-fields";

function Harness() {
  const methods = useForm();
  const [publishers, setPublishers] = useState([{ id: "p1", name: "Viz Media" }]);
  return (
    <FormProvider {...methods}>
      <SeriesFormFields
        publishers={publishers}
        onPublisherCreated={(pub) => setPublishers((list) => [...list, pub])}
      />
    </FormProvider>
  );
}

describe("SeriesFormFields publisher creation", () => {
  it("shows a newly created publisher as the selected option", async () => {
    render(<Harness />);
    const select = document.getElementById("publisherId") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "__create__" } });
    fireEvent.change(screen.getByLabelText("New name"), { target: { value: "Kodansha" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Add" }));
    });

    const after = document.getElementById("publisherId") as HTMLSelectElement;
    expect([...after.options].map((o) => o.text)).toContain("Kodansha");
    expect(after.value).toBe("p-new");
  });
});
