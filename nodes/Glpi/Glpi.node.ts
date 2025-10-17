import {
  INodeType,
  INodeTypeDescription,
  IExecuteFunctions,
  INodeExecutionData,
  IHttpRequestOptions,
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
      baseURL: '={{$credentials.url}}/api.php',
    },
    properties: properties,
		usableAsTool: true, // Use the auto-generated properties from OpenAPI spec
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // GLPI 11 uses OAuth2 authentication which is handled by n8n's credential system
    // The OpenAPI spec defines all endpoints and the node properties are auto-generated
    // This execute method delegates to the httpRequestWithAuthentication helper

    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    // Process each input item
    for (let i = 0; i < items.length; i++) {
      try {
        // The operation parameters are dynamically generated from the OpenAPI spec
        // We use httpRequestWithAuthentication which handles OAuth2 automatically
        const response = await this.helpers.httpRequestWithAuthentication.call(
          this,
          'glpiApi',
          {} as IHttpRequestOptions,
        );

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
