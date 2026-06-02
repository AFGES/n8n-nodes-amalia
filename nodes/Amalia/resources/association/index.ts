import type { INodeProperties } from 'n8n-workflow';
import { listOutput, listProperties } from '../shared/listParams';

const showOnlyForAssociations = {
	resource: ['association'],
};

export const associationDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForAssociations },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many associations',
				description: 'List associations',
				routing: {
					request: { method: 'GET', url: '/association' },
					...listOutput,
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get an association',
				description: 'Get a single association by its number',
				routing: {
					request: {
						method: 'GET',
						url: '=/association/{{$parameter.associationNumber}}',
					},
				},
			},
		],
		default: 'getAll',
	},
	{
		displayName: 'Association Number',
		name: 'associationNumber',
		type: 'string',
		required: true,
		displayOptions: { show: { ...showOnlyForAssociations, operation: ['get'] } },
		default: '',
		description: 'The number (numero) of the association to retrieve',
	},
	...listProperties('association'),
];
