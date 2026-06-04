import type { INodeProperties } from 'n8n-workflow';
import { castDateFields } from '../shared/listParams';

const showOnlyForPieces = {
	resource: ['piece'],
};

export const pieceDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForPieces },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a piece',
				description: 'Get a single document piece of a request',
				routing: {
					request: {
						method: 'GET',
						url: '=/pieces/{{$parameter.requeteNumber}}/{{$parameter.pieceId}}',
					},
					output: { postReceive: [castDateFields] },
				},
			},
		],
		default: 'get',
	},
	{
		displayName: 'Request Number',
		name: 'requeteNumber',
		type: 'string',
		required: true,
		displayOptions: { show: { ...showOnlyForPieces, operation: ['get'] } },
		default: '',
		description: 'The number (numero) of the request the piece belongs to',
	},
	{
		displayName: 'Piece ID',
		name: 'pieceId',
		type: 'string',
		required: true,
		displayOptions: { show: { ...showOnlyForPieces, operation: ['get'] } },
		default: '',
		description: 'The ID of the piece to retrieve',
	},
];
