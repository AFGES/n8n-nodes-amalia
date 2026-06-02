import type { INodeProperties } from 'n8n-workflow';
import { listOutput, listProperties } from '../shared/listParams';

const showOnlyForRequetes = {
	resource: ['requete'],
};

export const requeteDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForRequetes },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many requests',
				description: 'List requests',
				routing: {
					request: { method: 'GET', url: '/requete' },
					...listOutput,
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a request',
				description: 'Get a single request by its number',
				routing: {
					request: {
						method: 'GET',
						url: '=/requete/{{$parameter.requeteNumber}}',
					},
				},
			},
			{
				name: 'Get Depot',
				value: 'getDepot',
				action: 'Get a depot',
				description: 'Get a temporary deposit (depot) by its ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/depot/{{$parameter.depotId}}',
					},
				},
			},
		],
		default: 'getAll',
	},
	{
		displayName: 'Request Number',
		name: 'requeteNumber',
		type: 'string',
		required: true,
		displayOptions: { show: { ...showOnlyForRequetes, operation: ['get'] } },
		default: '',
		description: 'The number (numero) of the request to retrieve',
	},
	{
		displayName: 'Depot ID',
		name: 'depotId',
		type: 'string',
		required: true,
		displayOptions: { show: { ...showOnlyForRequetes, operation: ['getDepot'] } },
		default: '',
		description: 'The ID of the depot to retrieve',
	},
	...listProperties('requete'),
];
