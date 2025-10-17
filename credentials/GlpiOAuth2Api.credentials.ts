import {
	ICredentialType,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

/**
 * GLPI API Credentials for GLPI 11+
 * Uses OAuth2 password grant authentication
 */
export class GlpiOAuth2Api implements ICredentialType {
	name = 'glpiOAuth2Api';
	displayName = 'GLPI OAuth2 API';
	documentationUrl = 'https://glpi-developer-documentation.readthedocs.io/en/latest/devapi/hlapi/';
	icon: Icon = { light: 'file:../icons/glpi_white.svg', dark: 'file:../icons/glpi_color.svg' };
	extends = ['oAuth2Api'];
	properties: INodeProperties[] = [
		{
			displayName: 'GLPI URL',
			name: 'glpiUrl',
			type: 'string',
			default: '',
			placeholder: 'http://localhost',
			description: 'The base URL of your GLPI installation',
			required: true,
		},
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'password',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: '={{$self["glpiUrl"]}}/api.php/authorize',
			required: true,
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: '={{$self["glpiUrl"]}}/api.php/token',
			required: true,
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: 'email user api inventory status graphql',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'header',
		},
	];
}
