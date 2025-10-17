import {
	ICredentialType,
	INodeProperties,
	IAuthenticateGeneric,
	Icon,
} from 'n8n-workflow';

/**
 * GLPI API Credentials
 * This credential type supports multiple authentication methods for GLPI
 */
export class GlpiApi implements ICredentialType {
	name = 'glpiApi';
	displayName = 'GLPI API';
	documentationUrl = 'https://glpi-project.org/documentation/';
	icon: Icon = { light: 'file:../icons/glpi_white.svg', dark: 'file:../icons/glpi_color.svg' };
	properties: INodeProperties[] = [
		{
			displayName: 'GLPI URL',
			name: 'url',
			type: 'string',
			default: '',
			placeholder: 'https://your-glpi-instance.com/glpi',
			description: 'The base URL of your GLPI installation (without /apirest.php)',
			required: true,
		},
		{
			displayName: 'Authentication Method',
			name: 'authenticationType',
			type: 'options',
			options: [
				{
					name: 'User Credentials',
					value: 'userCredentials',
					description: 'Authenticate with username and password',
				},
				{
					name: 'User Token',
					value: 'userToken',
					description: 'Authenticate with a user token',
				},
				{
					name: 'Session Token',
					value: 'sessionToken',
					description: 'Use an existing session token',
				},
			],
			default: 'userCredentials',
			description: 'How to authenticate with the GLPI API',
		},
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			description: 'Your GLPI username',
			displayOptions: {
				show: {
					authenticationType: ['userCredentials'],
				},
			},
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
			displayOptions: {
				show: {
					authenticationType: ['userCredentials'],
				},
			},
		},
		{
			displayName: 'User Token',
			name: 'userToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Your GLPI API user token (can be generated in your GLPI user preferences)',
			displayOptions: {
				show: {
					authenticationType: ['userToken'],
				},
			},
		},
		{
			displayName: 'Session Token',
			name: 'sessionToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'An existing GLPI session token',
			displayOptions: {
				show: {
					authenticationType: ['sessionToken'],
				},
			},
		},
		{
			displayName: 'App Token',
			name: 'appToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Optional: Application token from GLPI API configuration (Setup > General > API)',
			required: false,
		},
	];

	// This method is called by n8n to authenticate requests
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'App-Token': '={{$credentials.appToken}}',
			},
		},
	};

	// Test method to verify the credentials work
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.url}}',
			url: '/apirest.php/getGlpiConfig',
			headers: {
				'App-Token': '={{$credentials.appToken}}',
			},
		},
	};
}

// Interface for credential test request
interface ICredentialTestRequest {
	request: {
		baseURL: string;
		url: string;
		headers?: Record<string, string>;
	};
}
