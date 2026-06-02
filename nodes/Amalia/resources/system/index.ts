import type { INodeProperties } from 'n8n-workflow';

const showOnlyForSystem = {
	resource: ['system'],
};

export const systemDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForSystem },
		options: [
			{
				name: 'Get Constants',
				value: 'getConstants',
				action: 'Get constants',
				description: 'Get the API constants (enum values and metadata)',
				routing: {
					request: { method: 'GET', url: '/constantes' },
				},
			},
		],
		default: 'getConstants',
	},
];
