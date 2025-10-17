# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an n8n community node that provides integration with GLPI 11+ (IT Asset Management and Helpdesk System). The node is built using the `@devlikeapro/n8n-openapi-node` package, which generates n8n node properties from an OpenAPI specification.

**GLPI Version**: This node supports GLPI 11+ with the new High-Level API (HL API). The legacy REST API (GLPI 9/10) is not supported by this version.

## Key Architecture

### OpenAPI-Driven Design

The node uses an **OpenAPI specification** (`nodes/Glpi/openapi.json`) to automatically generate its properties, operations, and fields:

- **Builder Pattern**: `N8NPropertiesBuilder` from `@devlikeapro/n8n-openapi-node` parses the OpenAPI spec and generates n8n node properties
- **Configuration**: `N8NPropertiesBuilderConfig` in `Glpi.node.ts` allows customization of the generated properties
- **Updating the Spec**: If you need to add/modify operations, update `openapi.json` and rebuild

### Authentication Flow

The node implements **OAuth2 authentication** for GLPI 11:

1. **OAuth2 Password Grant**: Uses username/password to obtain OAuth2 access tokens
2. **Token Management**: n8n's credential system handles token refresh automatically
3. **Request Headers**: Authentication is handled by n8n's `httpRequestWithAuthentication` helper

The credentials file (`GlpiApi.credentials.ts`) supports:
- Username/Password authentication (OAuth2 password grant)
- Optional Client ID and Client Secret for OAuth2 clients
- Scope: `api` for API access

### Request Execution Pattern

The node's `execute()` method in `Glpi.node.ts`:

1. Processes each input item
2. Uses `httpRequestWithAuthentication` helper which handles OAuth2 automatically
3. The OpenAPI spec defines all endpoints and operations
4. Request building is handled by the n8n framework based on the OpenAPI spec

**Important**: The base URL is set in `requestDefaults.baseURL` as `={{$credentials.url}}/api.php`

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

### API Endpoint Structure

GLPI 11 High-Level API uses a different structure than the legacy API:

- Base URL: `/api.php`
- Resources are under `/Assets/` (e.g., `/Assets/Computer`, `/Assets/Ticket`)
- RESTful design with standard HTTP methods (GET, POST, PATCH, PUT, DELETE)
- OAuth2 authentication via `/api.php/token` endpoint

### OpenAPI-Driven Operations

All operations are defined in the `openapi.json` file (112K+ lines). The `@devlikeapro/n8n-openapi-node` package automatically generates node properties from this specification.

### Error Handling

The node supports `continueOnFail()` mode - if enabled, errors are returned as JSON objects instead of throwing:

```typescript
{ error: error.message }
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

## GLPI 11 High-Level API Specifics

### API Endpoints

Base: `{glpi_url}/api.php`

- `/` - API root endpoint
- `/doc` - API documentation (HTML)
- `/doc.json` - OpenAPI specification (JSON)
- `/token` - OAuth2 token endpoint
- `/Assets/{AssetType}` - Asset resources (Computer, Monitor, NetworkEquipment, etc.)
- `/Assistance/{ItemType}` - Assistance items (Ticket, Change, Problem, etc.)
- `/Management/{ItemType}` - Management items (Budget, Contact, Contract, etc.)

### Authentication

GLPI 11 uses OAuth2:
- **Token URL**: `/api.php/token`
- **Grant Type**: `password` (username/password)
- **Scopes**: `api`, `user`, `email`, `inventory`, `status`, `graphql`
- **Token Management**: Handled automatically by n8n

### Resources

The HL API organizes resources by category:
- **Assets**: Computers, Monitors, Network Equipment, Peripherals, Phones, etc.
- **Assistance**: Tickets, Changes, Problems
- **Management**: Budgets, Contacts, Contracts, Documents
- **Administration**: Users, Groups, Entities, Profiles

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
