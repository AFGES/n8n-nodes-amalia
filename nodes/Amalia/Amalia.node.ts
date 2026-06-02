import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { associationDescription } from './resources/association';
import { requeteDescription } from './resources/requete';
import { pieceDescription } from './resources/piece';
import { lookupDescription } from './resources/lookup';
import { systemDescription } from './resources/system';

export class Amalia implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AMALIA',
		name: 'amalia',
		icon: 'file:amalia.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Afges Amalia API',
		defaults: {
			name: 'Afges Amalia',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'amaliaApi', required: true }],
		requestDefaults: {
			baseURL: '={{$credentials.baseUrl}}/api',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Association',
						value: 'association',
					},
					{
						name: 'Lookup',
						value: 'lookup',
					},
					{
						name: 'Piece',
						value: 'piece',
					},
					{
						name: 'Request',
						value: 'requete',
					},
					{
						name: 'System',
						value: 'system',
					},
				],
				default: 'association',
			},
			...associationDescription,
			...requeteDescription,
			...pieceDescription,
			...lookupDescription,
			...systemDescription,
		],
	};
}
