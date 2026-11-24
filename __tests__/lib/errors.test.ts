import { describe, it, expect } from "vitest";
import { AppError, NotFoundError, UnauthorizedError, ValidationError } from "@/lib/errors";

describe("errors", () => {
  it("are AppErrors carrying a user-facing message", () => {
    expect(new NotFoundError("Series").message).toBe("Series not found");
    expect(new UnauthorizedError().message).toBe("Unauthorized");
    expect(new ValidationError("Invalid input").message).toBe("Invalid input");
    for (const err of [new NotFoundError("x"), new UnauthorizedError(), new ValidationError("x")]) {
      expect(err).toBeInstanceOf(AppError);
    }
  });
});
