# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an n8n community node that provides integration with GLPI (IT Asset Management and Helpdesk System). The node is built using the `@devlikeapro/n8n-openapi-node` package, which generates n8n node properties from an OpenAPI specification.

## Key Architecture

### OpenAPI-Driven Design

The node uses an **OpenAPI specification** (`nodes/Glpi/openapi.json`) to automatically generate its properties, operations, and fields:

- **Builder Pattern**: `N8NPropertiesBuilder` from `@devlikeapro/n8n-openapi-node` parses the OpenAPI spec and generates n8n node properties
- **Configuration**: `N8NPropertiesBuilderConfig` in `Glpi.node.ts` allows customization of the generated properties
- **Updating the Spec**: If you need to add/modify operations, update `openapi.json` and rebuild

### Authentication Flow

The node implements a **session-based authentication** system:

1. **Initial Authentication**: Uses username/password (Basic Auth) to call `/initSession` endpoint
2. **Session Token**: Stores the returned `session_token` for subsequent requests
3. **Request Headers**: All API requests include `Session-Token` and optional `App-Token` headers
4. **Session Cleanup**: Calls `/killSession` after execution completes

The credentials file (`GlpiApi.credentials.ts`) supports three authentication methods:
- User Credentials (username/password)
- User Token
- Session Token

### Request Execution Pattern

The node's `execute()` method in `Glpi.node.ts`:

1. Gets credentials and initializes session if needed
2. Processes each input item
3. Maps operations (create/get/getAll/update/delete/search) to HTTP methods and endpoints
4. Builds request with proper headers and body
5. Cleans up session when done

**Important**: The base URL is set in `requestDefaults.baseURL` as `={{$credentials.url}}/apirest.php`

## Development Commands

### Essential Commands

```bash
# Build the node (compile TypeScript to dist/)
npm run build

# Development mode with auto-rebuild on file changes
npm run dev

# Run linter
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Prepare for release (runs before npm publish)
npm run prepublishOnly

# Release a new version
npm run release
```

### Development Helper Script

The repository includes `dev-helper.sh` for common tasks:

```bash
# Run the interactive helper
./dev-helper.sh
```

Options include:
- Build the node
- Install in local n8n (~/.n8n)
- Run development mode
- Run linter / fix linting
- Clean build files
- Fetch OpenAPI spec from GLPI instance (GLPI 10.1+ only)

### Testing Locally

To test the node in a local n8n instance:

```bash
npm run build
npm link
cd ~/.n8n
npm link n8n-nodes-glpi
# Restart n8n
```

## File Structure

```
credentials/
  GlpiApi.credentials.ts    # Credential type with authentication methods

nodes/Glpi/
  Glpi.node.ts              # Main node implementation with execute() logic
  Glpi.node.json            # Node metadata (categories, documentation URLs)
  openapi.json              # OpenAPI spec that defines operations

icons/                      # SVG icons for the node
dist/                       # Compiled output (git-ignored)
```

## Important Implementation Details

### Operation Mapping

The node maps high-level operations to GLPI REST API endpoints:

- **create** → POST `/{resource}`
- **get** → GET `/{resource}/{id}`
- **getAll** → GET `/{resource}` (with Range header for pagination)
- **update** → PUT `/{resource}/{id}`
- **delete** → DELETE `/{resource}/{id}` (with optional `force_purge` param)
- **search** → GET `/search/{resource}` (with query parameters)

### Request Body Format

GLPI API expects input wrapped in an `input` object:

```typescript
body = { input: createFields };  // For create/update operations
```

### Error Handling

The node supports `continueOnFail()` mode - if enabled, errors are returned as JSON objects instead of throwing:

```typescript
{ error: error.message, resource, operation }
```

## TypeScript Configuration

- **Target**: ES2019
- **Module**: CommonJS
- **Strict Mode**: Enabled with all strict checks
- **Output**: `dist/` directory
- **Includes**: `credentials/`, `nodes/`, and `package.json`

## Extending the Node

To add support for new GLPI resources or operations:

1. **Update OpenAPI Spec**: Modify `nodes/Glpi/openapi.json` to include new endpoints
2. **Update Operation Logic**: If needed, add custom handling in the `execute()` method's switch statement
3. **Rebuild**: Run `npm run build`

For GLPI 10.1+, you can fetch the latest OpenAPI spec from your instance:
- Navigate to `https://your-glpi.com/glpi/api.php/swagger`
- Export the OpenAPI specification
- Replace `nodes/Glpi/openapi.json`

## GLPI API Specifics

### API Endpoints

Base: `{glpi_url}/apirest.php`

- `/initSession` - Initialize authentication session
- `/killSession` - Close authentication session
- `/{resource}` - CRUD operations on resources (Ticket, Computer, User, etc.)
- `/search/{resource}` - Advanced search with criteria

### Headers

Required headers for authenticated requests:
- `Session-Token`: Session token from initSession
- `App-Token`: (Optional) Application token for additional security
- `Content-Type: application/json`
- `Accept: application/json`

### Pagination

Use `Range` header for pagination on getAll operations:
- Format: `0-50` (get items 0-50)
- GLPI returns content-range info in response headers

## Package Details

- **Name**: `n8n-nodes-glpi`
- **Type**: n8n community node package
- **Main Dependency**: `@devlikeapro/n8n-openapi-node` for OpenAPI-based property generation
- **n8n API Version**: 1
- **Build Tool**: `@n8n/node-cli`

## Important Limitations

### n8n Cloud Compatibility

**This node is designed for self-hosted n8n installations only.** It cannot be published to the n8n Cloud community nodes registry because:

- n8n Cloud does not allow community nodes with external dependencies (beyond peer dependencies like `n8n-workflow`)
- This node depends on `@devlikeapro/n8n-openapi-node` for its core functionality
- The linter will flag this with: `@n8n/community-nodes/no-restricted-imports`

To make this node compatible with n8n Cloud, you would need to:
1. Remove the `@devlikeapro/n8n-openapi-node` dependency
2. Manually code all node properties (resources, operations, fields) instead of generating them from the OpenAPI spec
3. This would require rewriting approximately 1000+ lines of property definitions

**Distribution**: This node can still be distributed via npm and installed in self-hosted n8n instances using `npm install n8n-nodes-glpi`.

## Code Style

- **Formatter**: Prettier (see `.prettierrc.js`)
  - Tabs for indentation (width: 2)
  - Single quotes
  - Semicolons required
  - Trailing commas
- **Linter**: ESLint with `@n8n/node-cli/eslint` config
