import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UserAvatar } from "@/components/ui/user-avatar";

describe("UserAvatar", () => {
  it("draws a light and a dark portrait seeded on the user id", () => {
    const { container } = render(
      <UserAvatar user={{ id: "user-1", avatarUrl: null }} size={40} />,
    );
    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(2);
    expect(images[0].getAttribute("src")).toMatch(/^data:image\/svg\+xml/);
    expect(images[0].className).toContain("dark:hidden");
    expect(images[1].className).toContain("dark:block");
  });

  it("gives the same portrait for the same id and a different one for another id", () => {
    const src = (id: string) =>
      render(<UserAvatar user={{ id, avatarUrl: null }} size={40} />)
        .container.querySelector("img")
        ?.getAttribute("src");
    expect(src("user-1")).toBe(src("user-1"));
    expect(src("user-1")).not.toBe(src("user-2"));
  });

  it("shows the photo when the user has one", () => {
    const { container } = render(
      <UserAvatar user={{ id: "user-1", avatarUrl: "/photo.png" }} size={40} />,
    );
    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(1);
    expect(images[0].getAttribute("src")).toContain("photo.png");
  });
});
