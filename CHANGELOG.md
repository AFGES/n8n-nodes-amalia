# Changelog

## 0.2.0

- Replace placeholder `Company`/`User` resources with the real AMALIA API.
- Add read-only resources and operations:
  - **Association**: Get Many, Get
  - **Request**: Get Many, Get, Get Depot
  - **Piece**: Get
  - **Lookup**: Search Communes, Search Countries, Search Nationalities
  - **System**: Get Constants
- List operations support SpringData pagination (`page`/`size`/`sort`), a
  `Return All` toggle, `Limit`, `Sort` and arbitrary search `Filters`.
- Node base URL now follows the credential's `baseUrl` field
  (`{baseUrl}/api`) instead of a hardcoded host.
- Fix 401 on authenticated requests: mark the credential `accessToken` as
  `expirable` so n8n actually runs `preAuthentication` (mint on first use,
  refresh on token expiry) instead of sending an empty `Bearer` header.
