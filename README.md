# n8n-nodes-glpi

This is an n8n community node that provides integration with [GLPI](https://glpi-project.org/) (Gestionnaire Libre de Parc Informatique), a powerful open-source IT Asset Management, issue tracking system, and service desk solution.

## What is GLPI?

GLPI is a comprehensive IT management suite that helps organizations manage their IT infrastructure, handle support tickets, track assets, manage software licenses, and much more. This n8n node allows you to integrate GLPI into your automation workflows, enabling you to:

- Automatically create and update tickets based on external events
- Synchronize asset information between GLPI and other systems  
- Generate reports and analytics from GLPI data
- Automate routine IT service management tasks
- Integrate GLPI with communication platforms, monitoring tools, and other business systems

## Prerequisites

Before you begin using this node, ensure you have:

1. **n8n installed**: You need n8n installed either locally or on a server. Visit [n8n.io](https://n8n.io) for installation instructions.

2. **GLPI instance**: You need access to a GLPI installation (version 9.x or later recommended, version 10.1+ for best API support).

3. **GLPI API enabled**: The REST API must be enabled in your GLPI instance:
   - Go to Setup → General → API
   - Enable the REST API
   - Optionally create an API client and generate an App Token for additional security

4. **GLPI user credentials**: You'll need valid GLPI user credentials with appropriate permissions for the operations you want to perform.

## Installation

### Install in n8n

There are several ways to install this community node in your n8n instance:

#### Option 1: Install from npm (Recommended for production)

Once published to npm, you can install it directly:

```bash
# Navigate to your n8n installation directory
cd ~/.n8n

# Install the node
npm install n8n-nodes-glpi
```

#### Option 2: Install from source (For development)

```bash
# Clone this repository
git clone https://github.com/yourusername/n8n-nodes-glpi.git
cd n8n-nodes-glpi

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

#### Option 3: Install from GitHub

```bash
# Install directly from GitHub
cd ~/.n8n
npm install github:yourusername/n8n-nodes-glpi
```

After installation, restart your n8n instance, and the GLPI node will appear in the node palette.

## Development Setup

If you want to contribute to this node or customize it for your needs, here's how to set up the development environment:

```bash
# Clone the repository
git clone https://github.com/yourusername/n8n-nodes-glpi.git
cd n8n-nodes-glpi

# Install dependencies
npm install

# Build the node
npm run build

# For development with auto-rebuild on changes
npm run dev
```

## Configuration

### Setting up GLPI Credentials in n8n

1. In n8n, go to **Credentials** → **New**
2. Select **GLPI API** from the list
3. Configure the following fields:

   - **GLPI URL**: Your GLPI instance URL (e.g., `https://glpi.example.com/glpi`)
   - **Authentication Method**: Choose one of:
     - **User Credentials**: Use username and password (most common)
     - **User Token**: Use a pre-generated API token from your GLPI user preferences
     - **Session Token**: Use an existing session token (for advanced scenarios)
   - **Username**: Your GLPI username (if using User Credentials)
   - **Password**: Your GLPI password (if using User Credentials)
   - **App Token**: (Optional) Application token from GLPI API configuration for additional security

4. Click **Create** to save the credentials

### Testing Your Connection

After setting up credentials, you can test the connection by creating a simple workflow:

1. Add a GLPI node to your workflow
2. Select your GLPI credentials
3. Choose **Tickets** as the resource
4. Choose **Get All** as the operation
5. Execute the node

If the connection is successful, you should see a list of tickets from your GLPI instance.

## Node Operations

The GLPI node supports operations on various resources. Here's what you can do with each:

### Tickets

Tickets are the core of GLPI's helpdesk functionality. You can:

- **Create**: Create new support tickets with custom fields like title, description, priority, category, etc.
- **Get**: Retrieve a specific ticket by ID to check its status or details
- **Get All**: List all tickets with optional filtering and pagination
- **Update**: Modify existing tickets (change status, assign to technicians, add solutions)
- **Delete**: Remove tickets (with optional permanent deletion)
- **Search**: Advanced search with multiple criteria

### Computers

Manage your IT assets and computer inventory:

- **Create**: Add new computers to the inventory
- **Get**: Retrieve details about a specific computer
- **Get All**: List all computers in the system
- **Update**: Update computer information (location, user, specifications)
- **Delete**: Remove computers from inventory

### Users

Handle user management:

- **Create**: Add new users to GLPI
- **Get**: Retrieve user information
- **Get All**: List all users
- **Update**: Modify user details and permissions

### Software

Track software licenses and installations:

- **Create**: Add new software entries
- **Get All**: List software inventory
- **Update**: Modify software information

### Documents

Manage documentation and file attachments:

- **Upload**: Upload documents to GLPI
- **Get All**: List available documents

## Example Workflows

### Example 1: Create Ticket from Email

This workflow monitors an email inbox and creates GLPI tickets automatically:

```json
{
  "name": "Email to GLPI Ticket",
  "nodes": [
    {
      "name": "Email Trigger",
      "type": "n8n-nodes-base.emailReadImap",
      "position": [250, 300]
    },
    {
      "name": "GLPI",
      "type": "n8n-nodes-glpi.Glpi",
      "position": [450, 300],
      "parameters": {
        "resource": "Ticket",
        "operation": "create",
        "name": "={{$node[\"Email Trigger\"].json[\"subject\"]}}",
        "content": "={{$node[\"Email Trigger\"].json[\"text\"]}}",
        "urgency": 3,
        "impact": 3
      }
    }
  ]
}
```

### Example 2: Daily Ticket Report

Generate a daily report of all open tickets:

```json
{
  "name": "Daily GLPI Report",
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
      "name": "Get Open Tickets",
      "type": "n8n-nodes-glpi.Glpi",
      "parameters": {
        "resource": "Ticket",
        "operation": "search",
        "searchCriteria": {
          "criteria[0][field]": "12",
          "criteria[0][searchtype]": "equals",
          "criteria[0][value]": "2"
        }
      }
    }
  ]
}
```

## Troubleshooting

### Common Issues and Solutions

**Issue: "Failed to initialize GLPI session"**
- Check that your GLPI URL is correct and includes the path to GLPI (e.g., `/glpi`)
- Verify that the REST API is enabled in GLPI settings
- Ensure your credentials are correct
- Check if your user has sufficient permissions

**Issue: "404 Not Found" errors**
- Verify the GLPI URL doesn't have `/apirest.php` at the end (the node adds this automatically)
- Check if the resource you're trying to access exists in your GLPI version

**Issue: "Session Token expired"**
- GLPI sessions expire after a period of inactivity
- The node handles session initialization automatically, but you may need to re-authenticate

**Issue: Node doesn't appear in n8n**
- Restart n8n after installation
- Check that the node is properly listed in package.json
- Verify the build completed successfully with `npm run build`

### Debug Mode

To enable detailed logging for troubleshooting:

```bash
# Set n8n to verbose logging
export N8N_LOG_LEVEL=debug

# Start n8n
n8n start
```

## Advanced Usage

### Using with GLPI 10.1+ (Modern API)

GLPI 10.1 and later versions include a new modern API with built-in OpenAPI/Swagger support. If you're using GLPI 10.1+:

1. Access the Swagger UI at: `https://your-glpi.com/glpi/api.php/swagger`
2. You can export the OpenAPI specification and update the `openapi.json` file in this node for the latest endpoints
3. The modern API uses OAuth2 authentication, which provides better security

### Customizing the OpenAPI Specification

The node uses an OpenAPI specification file (`nodes/Glpi/openapi.json`) to generate its properties. You can customize this file to:

- Add new endpoints specific to your GLPI plugins
- Modify field descriptions and defaults
- Add custom validation rules

After modifying the OpenAPI spec, rebuild the node:

```bash
npm run build
```

### Extending the Node

You can extend this node to support additional GLPI features:

1. Edit `nodes/Glpi/openapi.json` to add new endpoints
2. Modify `nodes/Glpi/Glpi.node.ts` to handle special logic
3. Update `credentials/GlpiApi.credentials.ts` for new authentication methods

## API Rate Limiting

Be aware of potential rate limiting on your GLPI instance:

- GLPI doesn't have built-in rate limiting by default
- Your web server or reverse proxy might impose limits
- For bulk operations, consider using batch endpoints when available
- Implement delays between requests in your workflows if needed

## Security Best Practices

1. **Use HTTPS**: Always use HTTPS for your GLPI instance to encrypt data in transit
2. **App Tokens**: Use App Tokens for an additional layer of security
3. **Minimal Permissions**: Create dedicated GLPI users with minimal required permissions
4. **Rotate Credentials**: Regularly rotate API tokens and passwords
5. **Audit Logs**: Monitor GLPI's event logs for unusual API activity

## Contributing

We welcome contributions to improve this node! Here's how you can help:

1. **Report Issues**: If you find bugs, please [create an issue](https://github.com/yourusername/n8n-nodes-glpi/issues)
2. **Suggest Features**: Have ideas for new features? Open a discussion
3. **Submit Pull Requests**: 
   - Fork the repository
   - Create your feature branch (`git checkout -b feature/AmazingFeature`)
   - Commit your changes (`git commit -m 'Add some AmazingFeature'`)
   - Push to the branch (`git push origin feature/AmazingFeature`)
   - Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add comments for complex logic
- Update documentation for new features
- Test your changes thoroughly
- Ensure the build passes (`npm run build`)

## Resources

- [GLPI Documentation](https://glpi-project.org/documentation/)
- [GLPI API Documentation](https://github.com/glpi-project/glpi/blob/master/apirest.md)
- [n8n Documentation](https://docs.n8n.io)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)
- [OpenAPI Specification](https://swagger.io/specification/)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

## Changelog

### Version 0.1.0 (Initial Release)
- Basic CRUD operations for Tickets, Computers, and Users
- Search functionality
- Support for multiple authentication methods
- OpenAPI-based property generation

## Support

- For issues with this node: [GitHub Issues](https://github.com/yourusername/n8n-nodes-glpi/issues)
- For GLPI questions: [GLPI Forums](https://forum.glpi-project.org/)
- For n8n questions: [n8n Community](https://community.n8n.io)

## Acknowledgments

- Thanks to the GLPI team for creating an excellent open-source ITSM solution
- Thanks to the n8n team for building an amazing workflow automation platform
- Thanks to [@devlikeapro](https://github.com/devlikeapro) for the n8n-openapi-node tool
- Thanks to all contributors who help improve this integration

---

**Note**: This node is not officially affiliated with or endorsed by the GLPI project. It's a community contribution to help integrate GLPI with n8n workflows.
