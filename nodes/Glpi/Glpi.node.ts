import { 
  INodeType, 
  INodeTypeDescription, 
  IExecuteFunctions, 
  INodeExecutionData, 
  IHttpRequestOptions 
} from 'n8n-workflow';
import { N8NPropertiesBuilder, N8NPropertiesBuilderConfig } from '@devlikeapro/n8n-openapi-node';
import * as doc from './openapi.json';

/**
 * GLPI Node for n8n
 * This node provides integration with GLPI (Gestionnaire Libre de Parc Informatique)
 * IT Asset Management and Helpdesk System
 */

// Configuration for the OpenAPI properties builder
// This allows us to customize how the properties are generated from the OpenAPI spec
const config: N8NPropertiesBuilderConfig = {
  // We can add custom configuration here if needed
  // For example, to filter out certain operations or customize field display
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
        name: 'glpiApi',
        required: true,
      },
    ],
    requestDefaults: {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      baseURL: '={{$credentials.url}}/apirest.php',
    },
    properties: properties,
		usableAsTool: true, // Use the auto-generated properties from OpenAPI spec
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const credentials = await this.getCredentials('glpiApi');
    
    // Get the operation and resource from the node parameters
    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    // Initialize session if not already done
    let sessionToken = credentials.sessionToken as string;
    
    // If we don't have a session token, we need to initialize the session first
    if (!sessionToken && credentials.username && credentials.password) {
      try {
        // Prepare authentication
        const authString = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
        
        const initSessionOptions: IHttpRequestOptions = {
          method: 'GET',
          url: `${credentials.url}/apirest.php/initSession`,
          headers: {
            'Authorization': `Basic ${authString}`,
            'App-Token': credentials.appToken as string || '',
          },
        };

        const sessionResponse = await this.helpers.httpRequest(initSessionOptions);
        sessionToken = sessionResponse.session_token;
      } catch (error) {
        throw new Error(`Failed to initialize GLPI session: ${error.message}`);
      }
    }

    // Process each item
    for (let i = 0; i < items.length; i++) {
      try {
        // Build the request based on the operation
        const requestOptions: IHttpRequestOptions = {
          method: 'GET',
          url: '',
          headers: {
            'Session-Token': sessionToken,
            'App-Token': credentials.appToken as string || '',
          },
        };

        // Determine the HTTP method and URL based on the operation
        let method = 'GET';
        let url = `${credentials.url}/apirest.php`;
        let body = {};

        // Map operations to HTTP methods and endpoints
        switch (operation) {
          case 'create':
            method = 'POST';
            url += `/${resource}`;
            // Get all the input fields for creation
            const createFields = this.getNodeParameter('additionalFields', i, {}) as any;
            body = { input: createFields };
            break;
          
          case 'get':
            method = 'GET';
            const getId = this.getNodeParameter('id', i) as string;
            url += `/${resource}/${getId}`;
            break;
          
          case 'getAll':
            method = 'GET';
            url += `/${resource}`;
            // Add range parameter if specified
            const range = this.getNodeParameter('range', i, '0-50') as string;
            if (range) {
              requestOptions.headers!['Range'] = range;
            }
            break;
          
          case 'update':
            method = 'PUT';
            const updateId = this.getNodeParameter('id', i) as string;
            url += `/${resource}/${updateId}`;
            const updateFields = this.getNodeParameter('updateFields', i, {}) as any;
            body = { input: updateFields };
            break;
          
          case 'delete':
            method = 'DELETE';
            const deleteId = this.getNodeParameter('id', i) as string;
            url += `/${resource}/${deleteId}`;
            const forcePurge = this.getNodeParameter('forcePurge', i, false) as boolean;
            if (forcePurge) {
              url += '?force_purge=true';
            }
            break;
          
          case 'search':
            method = 'GET';
            url += `/search/${resource}`;
            // Add search criteria
            const searchCriteria = this.getNodeParameter('searchCriteria', i, {}) as any;
            if (searchCriteria) {
              const queryParams: string[] = [];
              Object.keys(searchCriteria).forEach(key => {
                queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(searchCriteria[key])}`);
              });
              url += `?${queryParams.join('&')}`;
            }
            break;
        }

        requestOptions.method = method as any;
        requestOptions.url = url;
        
        if (method !== 'GET' && method !== 'DELETE') {
          requestOptions.body = body;
        }

        // Execute the request
        const response = await this.helpers.httpRequest(requestOptions);

        // Handle the response
        if (Array.isArray(response)) {
          returnData.push(...response.map(item => ({ json: item })));
        } else {
          returnData.push({ json: response });
        }

      } catch (error) {
        // Handle errors
        if (this.continueOnFail()) {
          returnData.push({ 
            json: { 
              error: error.message,
              resource,
              operation,
            } 
          });
          continue;
        }
        throw error;
      }
    }

    // Kill session when done (optional, but good practice)
    try {
      if (sessionToken) {
        await this.helpers.httpRequest({
          method: 'GET',
          url: `${credentials.url}/apirest.php/killSession`,
          headers: {
            'Session-Token': sessionToken,
          },
        });
      }
    } catch (error) {
      // Silently ignore session cleanup errors
    }

    return [returnData];
  }
}
