import { describe, it, expect } from "vitest";
import { AppError, NotFoundError, UnauthorizedError, ValidationError } from "@/lib/errors";

describe("AppError", () => {
  it("creates an error with code and status", () => {
    const err = new AppError("test", "TEST", 500);
    expect(err.message).toBe("test");
    expect(err.code).toBe("TEST");
    expect(err.statusCode).toBe(500);
    expect(err.name).toBe("AppError");
    expect(err).toBeInstanceOf(Error);
  });

  it("defaults to 400 status code", () => {
    const err = new AppError("test", "TEST");
    expect(err.statusCode).toBe(400);
  });
});

describe("NotFoundError", () => {
  it("creates a 404 error with resource name", () => {
    const err = new NotFoundError("Series");
    expect(err.message).toBe("Series not found");
    expect(err.code).toBe("NOT_FOUND");
    expect(err.statusCode).toBe(404);
    expect(err).toBeInstanceOf(AppError);
  });
});

describe("UnauthorizedError", () => {
  it("creates a 401 error", () => {
    const err = new UnauthorizedError();
    expect(err.message).toBe("Unauthorized");
    expect(err.code).toBe("UNAUTHORIZED");
    expect(err.statusCode).toBe(401);
  });
});

describe("ValidationError", () => {
  it("creates a 422 error", () => {
    const err = new ValidationError("Invalid input");
    expect(err.message).toBe("Invalid input");
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.statusCode).toBe(422);
  });
});
