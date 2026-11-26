export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`);
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super("Unauthorized");
  }
}

export class ValidationError extends AppError {}
