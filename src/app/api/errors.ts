/**
 * Error thrown by the API helpers. It is still an `Error` (so existing
 * `err.message` handling keeps working) but also carries the HTTP status and
 * the machine-readable `errors.code` the backend sends, e.g.
 * TWO_FACTOR_REQUIRED, which a caller needs to branch on.
 */
export class ApiError extends Error {
    status: number;
    code?: string;
    errors?: unknown;

    constructor(message: string, status: number, errors?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.errors = errors;
        const maybe = errors as { code?: unknown } | null | undefined;
        if (maybe && typeof maybe === "object" && typeof maybe.code === "string") {
            this.code = maybe.code;
        }
    }
}
