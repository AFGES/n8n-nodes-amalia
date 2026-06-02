import {
	NodeConnectionTypes,
	type ILoadOptionsFunctions,
	type INodePropertyOptions,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import { associationDescription } from './resources/association';
import { requeteDescription } from './resources/requete';
import { pieceDescription } from './resources/piece';
import { fetchTribunaux } from './resources/shared/tribunaux';

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
						name: 'Piece',
						value: 'piece',
					},
					{
						name: 'Request',
						value: 'requete',
					},
				],
				default: 'association',
			},
			...associationDescription,
			...requeteDescription,
			...pieceDescription,
		],
	};

	methods = {
		loadOptions: {
			// Populates the Tribunal filter dropdown with labels from /constantes.
			async getTribunaux(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const tribunaux = await fetchTribunaux.call(this);
				return tribunaux
					.map((t) => ({ name: t.libelle, value: t.id }))
					.sort((a, b) => a.name.localeCompare(b.name));
			},
		},
	};
}
