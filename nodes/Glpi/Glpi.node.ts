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
        // Get the parameters from the OpenAPI-generated properties
        const resource = this.getNodeParameter('resource', i) as string;
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

        // Debug logging
        console.log('=== GLPI Node Debug Info ===');
        console.log('Resource:', resource);
        console.log('Operation:', operation);
        console.log('Parsed Method:', method);
        console.log('Parsed Path:', path);
        console.log('Request Options:', JSON.stringify(requestOptions, null, 2));
        console.log('Credential Type:', 'glpiOAuth2Api');

        // Get credentials to debug
        const credentials = await this.getCredentials('glpiOAuth2Api');
        console.log('Credentials (without sensitive data):', {
          glpiUrl: credentials.glpiUrl,
          grantType: credentials.grantType,
          clientId: credentials.clientId ? '***' : undefined,
          clientSecret: credentials.clientSecret ? '***' : undefined,
          username: credentials.username ? '***' : undefined,
          password: credentials.password ? '***' : undefined,
          accessTokenUrl: credentials.accessTokenUrl,
          scope: credentials.scope,
          authentication: credentials.authentication,
          oauthTokenData: credentials.oauthTokenData ? '***' : undefined,
        });
        console.log('All credential keys:', Object.keys(credentials));

        // Debug oauthTokenData structure
        if (credentials.oauthTokenData) {
          const tokenData = credentials.oauthTokenData as any;
          console.log('OAuth Token Data structure:', {
            hasAccessToken: !!tokenData.access_token,
            hasRefreshToken: !!tokenData.refresh_token,
            tokenType: tokenData.token_type,
            expiresIn: tokenData.expires_in,
            keys: Object.keys(tokenData),
          });
        }
        console.log('=== End Debug Info ===');

        // Execute the request with OAuth2 authentication
        const response = await this.helpers.httpRequestWithAuthentication.call(
          this,
          'glpiOAuth2Api',
          requestOptions,
        );

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
