import {
  INodeType,
  INodeTypeDescription,
  IExecuteFunctions,
  INodeExecutionData,
  IHttpRequestOptions,
  IDataObject,
} from 'n8n-workflow';
import { N8NPropertiesBuilder, N8NPropertiesBuilderConfig } from '@devlikeapro/n8n-openapi-node';
import * as doc from './openapi.json';

/**
 * GLPI Node for n8n
 * This node provides integration with GLPI (Gestionnaire Libre de Parc Informatique)
 * IT Asset Management and Helpdesk System
 */

// Configuration for the OpenAPI properties builder
const config: N8NPropertiesBuilderConfig = {
  // We can add custom configuration here if needed
};

// Create the properties builder instance with our OpenAPI document
const parser = new N8NPropertiesBuilder(doc, config);

// Generate all the properties (fields, operations, etc.) from the OpenAPI spec
const properties = parser.build();

export class Glpi implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'GLPI',
    name: 'glpi',
    icon: 'file:glpi.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with GLPI - IT Asset Management and Helpdesk System',
    defaults: {
      name: 'GLPI',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'glpiOAuth2Api',
        required: true,
      },
    ],
    requestDefaults: {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      baseURL: '={{$credentials.glpiUrl}}/api.php',
    },
    properties: properties,
		usableAsTool: true,
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        // Get the operation parameter from the OpenAPI-generated properties
        const operation = this.getNodeParameter('operation', i) as string;

        // Parse the operation ID to extract HTTP method and path
        // Format: "GET -Administration-User-Me" -> method: GET, path: /Administration/User/Me
        const operationParts = operation.split(' ');
        const method = operationParts[0] as string;
        const pathPart = operationParts[1]?.replace(/^-/, '') || '';
        const path = '/' + pathPart.replace(/-/g, '/');

        // Build the request options
        // Note: url is just the path, baseURL is set in requestDefaults
        const requestOptions: IHttpRequestOptions = {
          method: method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
          url: path,
          headers: {
            'Accept': 'application/json',
          },
        };

        // Add Content-Type header and body for methods that support it
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
          requestOptions.headers!['Content-Type'] = 'application/json';

          // Get body parameters if they exist
          try {
            const bodyParameters = this.getNodeParameter('requestBody', i, {}) as IDataObject;
            if (Object.keys(bodyParameters).length > 0) {
              requestOptions.body = bodyParameters;
            }
          } catch {
            // requestBody parameter might not exist for all operations
          }
        }

        // Add query parameters if they exist
        try {
          const queryParameters = this.getNodeParameter('queryParameters', i, {}) as IDataObject;
          if (Object.keys(queryParameters).length > 0) {
            requestOptions.qs = queryParameters;
          }
        } catch {
          // queryParameters might not exist for all operations
        }

        // Get credentials for OAuth2 authentication
        const credentials = await this.getCredentials('glpiOAuth2Api');

        // Get or refresh OAuth2 token manually
        let accessToken = '';
        const tokenData = credentials.oauthTokenData as any;

        // Check if we have a valid token
        if (tokenData && tokenData.access_token && tokenData.expires_at) {
          const now = Math.floor(Date.now() / 1000);
          if (tokenData.expires_at > now) {
            // Token is still valid
            accessToken = tokenData.access_token;
          }
        }

        // If no valid token, get a new one
        if (!accessToken) {
          try {
            const tokenResponse = await this.helpers.request({
              method: 'POST',
              url: credentials.accessTokenUrl as string,
              auth: {
                username: credentials.clientId as string,
                password: credentials.clientSecret as string,
              },
              form: {
                grant_type: 'password',
                username: credentials.username,
                password: credentials.password,
                scope: credentials.scope,
              },
              json: true,
            });

            accessToken = tokenResponse.access_token;

            // TODO: Save token back to credentials for caching
            // This would require updating the credential, which is complex
          } catch (error) {
            throw new Error(`OAuth2 token request failed: ${error instanceof Error ? error.message : String(error)}`);
          }
        }

        // Add the access token to the request
        requestOptions.headers!['Authorization'] = `Bearer ${accessToken}`;

        // Build full URL
        const fullUrl = `${credentials.glpiUrl}/api.php${path}`;
        requestOptions.url = fullUrl;

        // Execute the request with the access token
        const response = await this.helpers.request(requestOptions);

        // Handle the response
        if (Array.isArray(response)) {
          returnData.push(...response.map(item => ({ json: item })));
        } else {
          returnData.push({ json: response });
        }
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error instanceof Error ? error.message : String(error),
            },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
