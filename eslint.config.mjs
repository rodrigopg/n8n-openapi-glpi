import { config } from '@n8n/node-cli/eslint';

export default [
	...config,
	{
		rules: {
			// Disable restriction on @devlikeapro/n8n-openapi-node
			// This node is designed for self-hosted n8n installations only
			'@n8n/community-nodes/no-restricted-imports': 'off',
		},
	},
];
