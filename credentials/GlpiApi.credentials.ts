import {
	ICredentialType,
	INodeProperties,
	IAuthenticateGeneric,
	ICredentialTestRequest,
	Icon,
} from 'n8n-workflow';

/**
 * GLPI API Credentials for GLPI 11+
 * Supports OAuth2 authentication with the High-Level API
 */
export class GlpiApi implements ICredentialType {
	name = 'glpiApi';
	displayName = 'GLPI API';
	documentationUrl = 'https://glpi-developer-documentation.readthedocs.io/en/latest/devapi/hlapi/';
	icon: Icon = { light: 'file:../icons/glpi_white.svg', dark: 'file:../icons/glpi_color.svg' };
	properties: INodeProperties[] = [
		{
			displayName: 'GLPI URL',
			name: 'url',
			type: 'string',
			default: '',
			placeholder: 'http://localhost',
			description: 'The base URL of your GLPI installation (e.g., http://localhost or https://glpi.example.com)',
			required: true,
		},
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			description: 'Your GLPI username',
			required: true,
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Your GLPI password',
			required: true,
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			placeholder: 'your-oauth-client-id',
			description: 'OAuth2 Client ID (optional, leave empty for password grant)',
			required: false,
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'OAuth2 Client Secret (optional)',
			required: false,
		},
	];

	// This method is called by n8n to authenticate requests
	// For GLPI 11, we use OAuth2 password grant
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			qs: {
				grant_type: 'password',
				username: '={{$credentials.username}}',
				password: '={{$credentials.password}}',
				client_id: '={{$credentials.clientId}}',
				client_secret: '={{$credentials.clientSecret}}',
				scope: 'api',
			},
		},
	};

	// Test method to verify the credentials work
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.url}}',
			url: '/api.php/v2',
			method: 'GET',
		},
	};
}
