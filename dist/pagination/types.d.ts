/**
 * Standard paginated response shape for list-like tool results.
 */
export interface PaginatedResponse {
    data: unknown[];
    pagination: {
        has_more: boolean;
        cursor: string | null;
    };
}
