export type PaginatedResponse<T> = {
  results: T[];
  count?: number;
  next?: string | null;
  previous?: string | null;
};

export const normalizeListResponse = <T>(
  payload: unknown,
  errorMessage = "Unexpected response format."
): T[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as PaginatedResponse<T>).results)
  ) {
    return (payload as PaginatedResponse<T>).results;
  }

  throw new Error(errorMessage);
};


