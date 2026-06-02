import type {
	IDataObject,
	IExecuteSingleFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { listOutput, listProperties } from '../shared/listParams';

const showOnlyForAssociations = {
	resource: ['association'],
};

/**
 * When "Show Version History" is enabled, output the association's version
 * history (`associationRehydrateVisibles`) — one item per version — instead of
 * the renamed `version` array. Default merges the newest version into the root.
 * Always one output item per association; the history is always newest-first.
 */
async function extractVersionHistory(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
	const show = this.getNodeParameter('rehydrateVisibles', false) as boolean;

	return items.map((item) => {
		const { associationRehydrateVisibles, ...rest } = (item.json ?? {}) as IDataObject;
		const versions = ((associationRehydrateVisibles ?? []) as IDataObject[]).slice().reverse();

		if (show) {
			// version mode: rename the history array to `version` (newest-first)
			return { json: { ...rest, version: versions }, pairedItem: item.pairedItem };
		}

		// default: merge the newest non-null `association` into the root,
		// drop the history array and the other per-version fields (evenement/requete/extrait)
		const latest = versions.find((v) => !!(v as IDataObject).association) as IDataObject | undefined;
		return {
			json: { ...rest, association: latest?.association ?? null },
			pairedItem: item.pairedItem,
		};
	});
}

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
					output: { postReceive: [extractVersionHistory] },
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
	{
		displayName: 'Show Version History',
		name: 'rehydrateVisibles',
		type: 'boolean',
		displayOptions: { show: { ...showOnlyForAssociations, operation: ['get'] } },
		default: false,
		description:
			'Whether to keep the full version history (newest-first) under a "version" field, instead of merging only the newest version into the association record',
	},
	...listProperties('association'),
];
