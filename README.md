# n8n-nodes-glpi

This is an n8n community node that provides integration with [GLPI 11+](https://glpi-project.org/) (Gestionnaire Libre de Parc Informatique), a powerful open-source IT Asset Management, issue tracking system, and service desk solution.

**⚠️ GLPI Version Requirement**: This node requires **GLPI 11.0 or later** and uses the new High-Level API (HL API). For GLPI 9.x/10.x (legacy REST API), please use version 0.1.x of this package.

## What is GLPI?

GLPI is a comprehensive IT management suite that helps organizations manage their IT infrastructure, handle support tickets, track assets, manage software licenses, and much more. This n8n node allows you to integrate GLPI into your automation workflows, enabling you to:

- Automatically create and update tickets, changes, and problems based on external events
- Synchronize asset information between GLPI and other systems
- Generate reports and analytics from GLPI data
- Automate routine IT service management tasks
- Integrate GLPI with communication platforms, monitoring tools, and other business systems

## What's New in Version 0.2.0

**Major Update - GLPI 11 High-Level API Support**

- ✨ **OAuth2 Authentication**: Modern, secure authentication with automatic token management
- 🚀 **Simplified API**: RESTful design with intuitive endpoint structure
- 📦 **Complete Resource Coverage**: Auto-generated from GLPI 11 OpenAPI specification (112K+ lines)
- 🔒 **Better Security**: OAuth2 password grant with optional client credentials
- 📚 **Organized Endpoints**: Resources grouped by category (Assets, Assistance, Management, Administration)

**Breaking Changes from 0.1.x:**
- Requires GLPI 11+
- OAuth2 authentication (no more session tokens)
- Different API base URL (`/api.php/v2` instead of `/apirest.php`)

## Prerequisites

Before you begin using this node, ensure you have:

1. **n8n installed**: You need n8n installed either locally or on a server. Visit [n8n.io](https://n8n.io) for installation instructions.

2. **GLPI 11+ instance**: You need access to a GLPI 11.0 or later installation with the High-Level API enabled.

3. **GLPI user credentials**: You'll need valid GLPI user credentials with appropriate permissions for the operations you want to perform.

## Installation

### Install in Self-Hosted n8n

**Important**: This node is designed for **self-hosted n8n installations only**. It cannot be used with n8n Cloud due to dependency restrictions.

#### For Production

```bash
# Navigate to your n8n custom nodes directory
cd ~/.n8n/custom

# Install the node
npm install n8n-nodes-glpi

# Restart n8n
```

#### For Docker

```bash
# Enter your n8n container
docker exec -it <container-name> sh

# Navigate to custom nodes directory
cd /root/.n8n/custom

# Install the node
npm install n8n-nodes-glpi

# Exit and restart container
exit
docker restart <container-name>
```

#### From Source (For Development)

```bash
# Clone this repository
git clone https://github.com/rodrigopg/n8n-openapi-glpi.git
cd n8n-openapi-glpi

# Install dependencies
npm install

# Build the node
npm run build

# Link the node to your n8n installation
npm link

# In your n8n directory, link to this package
cd ~/.n8n
npm link n8n-nodes-glpi
```

After installation, restart your n8n instance, and the GLPI node will appear in the node palette.

## Configuration

### Setting up GLPI Credentials in n8n

1. In n8n, go to **Credentials** → **New**
2. Select **GLPI API** from the list
3. Configure the following fields:

   - **GLPI URL**: Your GLPI instance base URL (e.g., `http://localhost` or `https://glpi.example.com`)
   - **Username**: Your GLPI username
   - **Password**: Your GLPI password
   - **Client ID**: (Optional) OAuth2 client ID if you've configured one
   - **Client Secret**: (Optional) OAuth2 client secret

4. Click **Create** to save the credentials

### OAuth2 Authentication

GLPI 11 uses OAuth2 for authentication. The node uses the **password grant** flow:

- The username and password are used to obtain an OAuth2 access token
- Tokens are automatically managed and refreshed by n8n
- The `api` scope is requested by default for API access

### Testing Your Connection

After setting up credentials, you can test the connection by creating a simple workflow:

1. Add a GLPI node to your workflow
2. Select your GLPI credentials
3. Choose a resource (e.g., **Computer** under Assets)
4. Choose an operation (e.g., **Get All**)
5. Execute the node

If the connection is successful, you should see a list of resources from your GLPI instance.

## Available Resources

The GLPI 11 High-Level API organizes resources by category. All resources and operations are automatically generated from the OpenAPI specification.

### Assets
- **Computers**: Desktop and laptop management
- **Monitors**: Display device tracking
- **Network Equipment**: Routers, switches, firewalls
- **Peripherals**: Printers, scanners, input devices
- **Phones**: Mobile and VoIP phones
- **And many more**: Cables, Racks, PDUs, Sensors, etc.

### Assistance (ITSM)
- **Tickets**: Incident and request management
- **Changes**: Change management workflow
- **Problems**: Problem tracking and resolution
- **Solutions**: Knowledge base solutions

### Management
- **Budgets**: Budget planning and tracking
- **Contacts**: Supplier and customer contacts
- **Contracts**: Contract lifecycle management
- **Documents**: Document repository
- **Suppliers**: Vendor management

### Administration
- **Users**: User account management
- **Groups**: Group and team organization
- **Entities**: Multi-entity support
- **Profiles**: Permission and role management

## Example Workflows

### Example 1: Create Ticket from Webhook

This workflow creates GLPI tickets automatically from webhook events:

```json
{
  "name": "Webhook to GLPI Ticket",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "parameters": {
        "path": "glpi-ticket",
        "responseMode": "onReceived"
      }
    },
    {
      "name": "GLPI",
      "type": "n8n-nodes-glpi.glpi",
      "position": [450, 300],
      "parameters": {
        "resource": "Ticket",
        "operation": "create",
        "name": "={{$node[\"Webhook\"].json[\"title\"]}}",
        "content": "={{$node[\"Webhook\"].json[\"description\"]}}"
      },
      "credentials": {
        "glpiApi": "GLPI API Credentials"
      }
    }
  ]
}
```

### Example 2: List All Computers

Get all computers from your GLPI inventory:

```json
{
  "name": "List GLPI Computers",
  "nodes": [
    {
      "name": "Schedule",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": {
          "interval": [{ "field": "hours", "hoursInterval": 24 }]
        }
      }
    },
    {
      "name": "Get Computers",
      "type": "n8n-nodes-glpi.glpi",
      "parameters": {
        "resource": "Assets/Computer",
        "operation": "getAll"
      },
      "credentials": {
        "glpiApi": "GLPI API Credentials"
      }
    }
  ]
}
```

## API Documentation

### Base URL Structure

All API requests use the base URL: `{your-glpi-url}/api.php/v2`

For example:
- `http://localhost/api.php/v2/Assets/Computer`
- `https://glpi.example.com/api.php/v2/Assistance/Ticket`

### OpenAPI Specification

The complete API specification can be accessed from your GLPI instance:

- **Documentation**: `{your-glpi-url}/api.php/v2/doc`
- **OpenAPI JSON**: `{your-glpi-url}/api.php/doc.json`

### Authentication Endpoints

- **Token URL**: `/api.php/token` (OAuth2 password grant)
- **Scopes**: `api`, `user`, `email`, `inventory`, `status`, `graphql`

## Troubleshooting

### Common Issues and Solutions

**Issue: "Failed to authenticate"**
- Verify your GLPI URL is correct (without `/api.php`)
- Ensure your username and password are correct
- Check that your user has API access permissions in GLPI
- Verify GLPI 11+ is installed (this node doesn't work with GLPI 9/10)

**Issue: "Node doesn't appear in n8n"**
- Restart n8n after installation
- Check that the node is properly installed with `npm list n8n-nodes-glpi`
- Verify you're using a self-hosted n8n (not n8n Cloud)

**Issue: "Resource not found"**
- Check if the resource exists in your GLPI version
- Some resources depend on enabled plugins
- Verify the endpoint in the OpenAPI documentation

**Issue: "Permission denied"**
- Ensure your user has the necessary permissions in GLPI
- Check entity restrictions
- Verify profile rights for the specific resource

### Debug Mode

To enable detailed logging for troubleshooting:

```bash
# Set n8n to verbose logging
export N8N_LOG_LEVEL=debug

# Start n8n
n8n start
```

## Architecture

### OpenAPI-Driven Design

This node uses an innovative approach:

1. **Dynamic Property Generation**: The `@devlikeapro/n8n-openapi-node` package reads the GLPI OpenAPI specification
2. **Automatic Updates**: When GLPI updates its API, you can simply fetch the new OpenAPI spec
3. **Complete Coverage**: All 112K+ lines of the OpenAPI spec are included, providing access to all GLPI resources

### OAuth2 Integration

Authentication is handled transparently:

- n8n's credential system manages OAuth2 tokens
- Automatic token refresh
- Secure credential storage

## Development

### Development Setup

```bash
# Clone the repository
git clone https://github.com/rodrigopg/n8n-openapi-glpi.git
cd n8n-openapi-glpi

# Install dependencies
npm install

# Build the node
npm run build

# For development with auto-rebuild on changes
npm run dev

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

### Updating the OpenAPI Specification

To update the OpenAPI spec from your GLPI 11 instance:

```bash
# Fetch the latest spec
curl http://your-glpi-url/api.php/doc.json | python3 -m json.tool > nodes/Glpi/openapi.json

# Rebuild
npm run build
```

### Development Helper Script

The repository includes a helper script for common tasks:

```bash
./dev-helper.sh
```

Options include:
- Build the node
- Install in local n8n
- Run development mode
- Run linter / fix linting
- Clean build files
- Fetch OpenAPI spec from GLPI instance

## Contributing

We welcome contributions to improve this node! Here's how you can help:

1. **Report Issues**: If you find bugs, please [create an issue](https://github.com/rodrigopg/n8n-openapi-glpi/issues)
2. **Suggest Features**: Have ideas for new features? Open a discussion
3. **Submit Pull Requests**:
   - Fork the repository
   - Create your feature branch (`git checkout -b feature/AmazingFeature`)
   - Commit your changes (`git commit -m 'Add some AmazingFeature'`)
   - Push to the branch (`git push origin feature/AmazingFeature`)
   - Open a Pull Request

## Resources

- [GLPI Website](https://glpi-project.org/)
- [GLPI 11 High-Level API Documentation](https://glpi-developer-documentation.readthedocs.io/en/latest/devapi/hlapi/)
- [n8n Documentation](https://docs.n8n.io)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)
- [OpenAPI Specification](https://swagger.io/specification/)

## Version History

### 0.2.0 (Latest)
- **BREAKING**: Upgraded to GLPI 11 High-Level API
- OAuth2 authentication support
- Updated OpenAPI specification (112K+ lines)
- Simplified node implementation
- Updated credentials for OAuth2
- Package size: 164.7 KB (unpacked: 9.3 MB)

### 0.1.2
- Fixed OpenAPI specification loading
- Package size: 107.7 KB (unpacked: 5.5 MB)

### 0.1.1
- Initial published version
- GLPI 9/10 REST API support (legacy)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Support

- For issues with this node: [GitHub Issues](https://github.com/rodrigopg/n8n-openapi-glpi/issues)
- For GLPI questions: [GLPI Forums](https://forum.glpi-project.org/)
- For n8n questions: [n8n Community](https://community.n8n.io)

## Acknowledgments

- Thanks to the GLPI team for creating an excellent open-source ITSM solution
- Thanks to the n8n team for building an amazing workflow automation platform
- Thanks to [@devlikeapro](https://github.com/devlikeapro) for the n8n-openapi-node tool
- Thanks to all contributors who help improve this integration

---

**Note**: This node is not officially affiliated with or endorsed by the GLPI project. It's a community contribution to help integrate GLPI with n8n workflows.
