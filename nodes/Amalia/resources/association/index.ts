import type {
	IDataObject,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { appendQs, listOutput, listProperties } from '../shared/listParams';
import { fetchTribunaux } from '../shared/tribunaux';

/** Selectable association states for the `etats` filter. */
const ETAT_OPTIONS = [
	{ name: 'Inscrite', value: 'INSCRITE' },
	{ name: 'Dissoute', value: 'DISSOUTE' },
	{ name: 'Radiée', value: 'RADIEE' },
	{ name: 'Non Conforme', value: 'NONCONFORME' },
];

/** Filter fields whose value is sent as a number. */
const NUMERIC_FILTER_FIELDS = ['volume', 'folio'];

/** Filter fields whose value is sent as a plain string. */
const STRING_FILTER_FIELDS = ['numero', 'nom', 'commune', 'codePostal', 'adresse'];

/**
 * Translates the Filters conditions into AMALIA search query params.
 * The endpoint only does equality (no operators) and AND-only matching, so each
 * condition becomes `field=value`. `etats` is multi-valued: every selected state
 * is appended as a repeated key (e.g. `etats=INSCRITE&etats=DISSOUTE`).
 *
 * The backend treats `etats` and `tribunal` as mandatory IN-lists — omitting
 * them returns zero rows. So when the user leaves them unset we default to
 * "all", mirroring the web client (App.vue seeds all états + all tribunaux).
 */
async function attachAssociationFilters(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const { condition = [] } = this.getNodeParameter('filters', {}) as {
		condition?: Array<{
			field: string;
			valueString?: string;
			valueNumber?: number;
			valueEtats?: string[];
			valueTribunal?: number[];
			valueMes?: boolean;
		}>;
	};

	const qs = (requestOptions.qs ?? {}) as IDataObject;
	for (const c of condition) {
		if (!c.field) {
			continue;
		}
		if (c.field === 'etats') {
			for (const etat of c.valueEtats ?? []) {
				appendQs(qs, 'etats', etat);
			}
			continue;
		}
		if (c.field === 'tribunal') {
			for (const id of c.valueTribunal ?? []) {
				appendQs(qs, 'tribunal', id);
			}
			continue;
		}

		const value =
			c.field === 'mes'
				? c.valueMes
				: NUMERIC_FILTER_FIELDS.includes(c.field)
					? c.valueNumber
					: c.valueString;

		if (value === undefined || value === '') {
			continue;
		}
		appendQs(qs, c.field, value);
	}

	// Default the mandatory IN-list filters to "all" when the user left them
	// unset, otherwise the backend returns zero rows.
	if (qs.etats === undefined) {
		for (const { value } of ETAT_OPTIONS) {
			appendQs(qs, 'etats', value);
		}
	}
	if (qs.tribunal === undefined) {
		for (const { id } of await fetchTribunaux.call(this)) {
			appendQs(qs, 'tribunal', id);
		}
	}

	requestOptions.qs = qs;
	return requestOptions;
}

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
					// `page` is sent explicitly: the SpringData list endpoint returns an
					// empty page when only `size` is present (the web client always sends
					// both). When Return All is on, the pagination block overrides `page`.
					request: { method: 'GET', url: '/association', qs: { page: 0 } },
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
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'fixedCollection',
		placeholder: 'Add Condition',
		typeOptions: { multipleValues: true },
		displayOptions: { show: { ...showOnlyForAssociations, operation: ['getAll'] } },
		default: {},
		description: 'Search criteria sent to the AMALIA association list endpoint',
		options: [
			{
				name: 'condition',
				displayName: 'Condition',
				values: [
					{
						displayName: 'Field',
						name: 'field',
						type: 'options',
						default: 'nom',
						description: 'Association field to filter on',
						options: [
							{ name: 'Address', value: 'adresse' },
							{ name: 'Commune', value: 'commune' },
							{ name: 'Folio', value: 'folio' },
							{ name: 'Mine Only', value: 'mes' },
							{ name: 'Name', value: 'nom' },
							{ name: 'Number', value: 'numero' },
							{ name: 'Postal Code', value: 'codePostal' },
							{ name: 'States', value: 'etats' },
							{ name: 'Tribunal', value: 'tribunal' },
							{ name: 'Volume', value: 'volume' },
						],
					},
					{
						displayName: 'Mine Only',
						name: 'valueMes',
						type: 'boolean',
						default: false,
						displayOptions: { show: { field: ['mes'] } },
					},
					{
						displayName: 'States',
						name: 'valueEtats',
						type: 'multiOptions',
						default: [],
						options: ETAT_OPTIONS,
						displayOptions: { show: { field: ['etats'] } },
					},
					{
						displayName: 'Tribunal Names or IDs',
						name: 'valueTribunal',
						type: 'multiOptions',
						default: [],
						description:
							'Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
						typeOptions: { loadOptionsMethod: 'getTribunaux' },
						displayOptions: { show: { field: ['tribunal'] } },
					},
					{
						displayName: 'Value',
						name: 'valueString',
						type: 'string',
						default: '',
						displayOptions: { show: { field: STRING_FILTER_FIELDS } },
					},
					{
						displayName: 'Value',
						name: 'valueNumber',
						type: 'number',
						default: 0,
						displayOptions: { show: { field: NUMERIC_FILTER_FIELDS } },
					},
				],
			},
		],
		routing: { send: { preSend: [attachAssociationFilters] } },
	},
	...listProperties('association', { genericFilters: false }),
];
