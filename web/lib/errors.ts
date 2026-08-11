/**
 * Erreurs typées pour l'API SunuAgri
 * Chaque erreur connaît son code HTTP et peut être sérialisée en Response JSON
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
    };
  }

  toResponse(): Response {
    return Response.json(this.toJSON(), { status: this.statusCode });
  }
}

export class AuthError extends AppError {
  constructor(message: string = "Authentication required", code?: string) {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Insufficient permissions", code?: string) {
    super(message, 403, code);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string = "Validation failed",
    public errors?: Record<string, string[]>
  ) {
    super(message, 400, "VALIDATION_ERROR");
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      errors: this.errors,
    };
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found", code?: string) {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource conflict", code?: string) {
    super(message, 409, code);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests", code?: string) {
    super(message, 429, code);
  }
}

/**
 * Handler global pour convertir les erreurs en Response JSON
 * Usage dans un catch :
 *
 * try {
 *   await doSomething();
 * } catch (error) {
 *   return handleError(error);
 * }
 */
export function handleError(error: unknown): Response {
  // Erreurs applicatives
  if (error instanceof AppError) {
    return error.toResponse();
  }

  // Erreurs Prisma
  if (error && typeof error === "object" && "code" in error) {
    const prismaError = error as { code: string; meta?: Record<string, unknown> };

    // Unique constraint violation
    if (prismaError.code === "P2002") {
      const target = (prismaError.meta?.target as string[]) || [];
      return new ConflictError(
        `Un enregistrement avec ${target.join(", ")} existe déjà`,
        "DUPLICATE_ENTRY"
      ).toResponse();
    }

    // Foreign key constraint failed
    if (prismaError.code === "P2003") {
      return new ValidationError(
        "Référence invalide : l'élément lié n'existe pas",
      ).toResponse();
    }

    // Record not found
    if (prismaError.code === "P2025") {
      return new NotFoundError("L'enregistrement demandé n'existe pas").toResponse();
    }
  }

  // Erreurs inconnues
  console.error("Unhandled error:", error);
  return Response.json(
    {
      error: "InternalServerError",
      message: "Une erreur interne est survenue",
      statusCode: 500,
    },
    { status: 500 }
  );
}
