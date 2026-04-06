# Error handling and validation

## Validation (incoming requests)

1. **One primary mechanism**: **Data annotations + `ModelState`** or **FluentValidation**—document the choice; don’t mix silently.
2. **Validate at the API boundary**: `POST` / `PUT` / `PATCH` body DTOs and complex query objects.
3. **Business rules** (e.g. allocation totals, `donation_type`-specific required fields, allowed `program_area` values) run in **services** after model validation passes.
4. **Timestamps**: document that API stores/returns **UTC** where types are `timestamp`; use **ISO-8601** in JSON.
5. **Money**: use `decimal`; monetary vs non-monetary rules depend on **`donation_type`** (see `dto-and-model-structure.md`).

## HTTP status codes (team standard)

| Situation | Code |
|-----------|------|
| Success with body | 200 |
| Created | 201 (optional `Location` header) |
| Success, no body | 204 |
| Field / binding validation failed | **400** |
| Not authenticated | **401** |
| Authenticated but not allowed | **403** |
| Resource missing | **404** |
| Conflict (duplicate, concurrency) | **409** |
| Unexpected failure | **500** (log with correlation id; generic message to client in production) |

## Error response format (single standard — RFC 7807 Problem Details)

The API uses **only** [RFC 7807](https://www.rfc-editor.org/rfc/rfc7807) **Problem Details** (`application/problem+json`). This is built into ASP.NET Core (`ProblemDetails`, `ValidationProblem`, `Results.Problem`).

**Rules**

- Every failed request that returns a body uses this shape (validation, forbidden, not found, conflict, unhandled mapped errors).
- Use **`title`** and **`detail`** for human-readable messages.
- Use **`status`** matching the HTTP status code.
- Prefer **`extensions`** for machine-readable codes the React app can branch on (e.g. `code`, `traceId`). ASP.NET Core exposes custom entries at the root of the JSON payload alongside standard fields when using `ProblemDetails.Extensions`.

**Validation (400)** — use `ValidationProblem(ModelState)` or equivalent so clients receive an **`errors`** dictionary keyed by field:

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "currencyCode": ["The currency code field is required for monetary donations."]
  },
  "traceId": "00-1a2b3c4d5e6f7890-..."
}
```

**Not found (404)**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Not Found",
  "status": 404,
  "detail": "Donation not found.",
  "code": "DONATION_NOT_FOUND",
  "traceId": "00-..."
}
```

(`code` and `traceId` are custom extension members your middleware or helper adds consistently.)

**Forbidden (403)**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.3",
  "title": "Forbidden",
  "status": 403,
  "detail": "You do not have access to this resident record.",
  "code": "FORBIDDEN",
  "traceId": "00-..."
}
```

**Conflict (409)**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.8",
  "title": "Conflict",
  "status": 409,
  "detail": "A conference already exists for this date and resident.",
  "code": "CONFERENCE_DUPLICATE",
  "traceId": "00-..."
}
```

Do **not** introduce a second parallel format (e.g. `{ "success": false, "error": { … } }`) for the same API.

## Success responses

Return **DTOs directly** with **200** / **201** (no required wrapper). Example:

```json
{
  "donationId": 42,
  "supporterId": 7,
  "donationType": "Monetary",
  "currencyCode": "PHP",
  "amount": 1500.00
}
```

If you need metadata (e.g. pagination), use **standard headers** or a **single agreed** pagination envelope for **list** endpoints only—document that separately; still avoid mixing arbitrary `{ "success": true }` wrappers on every resource.

## Examples — bad vs good

| Bad | Why |
|-----|-----|
| 500 with stack trace in production | Security and poor UX |
| 200 `{ "error": "not found" }` | Breaks HTTP semantics and React Query |
| Different JSON shape for errors on different endpoints | Frontend cannot implement one handler |

## Global exception handling

- Map known **business** failures to **Problem Details** with the right status and a stable **`code`** extension.
- **Log** full exceptions server-side; **never** leak internal exception messages in production **`detail`**.
- Include **`traceId`** in extensions and in server logs (`Activity.Current?.Id` or `HttpContext.TraceIdentifier`).

## Controllers vs filters

Prefer **`IExceptionHandler`** or an exception filter that produces **Problem Details**. In actions, use **`ValidationProblem(ModelState)`** for invalid input—avoid **try/catch** in every action.

## Logging

- **Information/Warning**: validation failures (sample if noisy).
- **Error**: unhandled exceptions with trace id and user id (if authenticated).
- **Never log**: passwords, full payment details, raw bearer tokens.

## React expectations

- Parse **`application/problem+json`** (or JSON with Problem Details fields).
- Read **`status`** for HTTP semantics; use **`errors`** for field-level 400s; use optional **`code`** for toasts or i18n.
- **401**: not logged in (redirect to login). **403**: logged in but not allowed.
