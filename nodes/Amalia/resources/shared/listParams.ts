import type {
	IDataObject,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

function castDatesInObject(obj: IDataObject): IDataObject {
	const result: IDataObject = {};
	for (const [key, value] of Object.entries(obj)) {
		if (key.startsWith('date') && typeof value === 'string' && value) {
			result[key] = new Date(value) as unknown as IDataObject[string];
		} else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
			result[key] = castDatesInObject(value as IDataObject) as IDataObject[string];
		} else if (Array.isArray(value)) {
			result[key] = (value as unknown[]).map((v) =>
				v !== null && typeof v === 'object' ? castDatesInObject(v as IDataObject) : v,
			) as IDataObject[string];
		} else {
			result[key] = value;
		}
	}
	return result;
}

export async function castDateFields(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
	return items.map((item) => ({
		json: castDatesInObject((item.json ?? {}) as IDataObject),
		pairedItem: item.pairedItem,
	}));
}

/**
 * Appends a query-string parameter, promoting to an array when the key already
 * exists so AMALIA receives repeated keys (e.g. `etats=A&etats=B`).
 */
export function appendQs(qs: IDataObject, key: string, value: unknown): void {
	const existing = qs[key];
	if (existing === undefined) {
		qs[key] = value as IDataObject[string];
	} else if (Array.isArray(existing)) {
		(existing as unknown[]).push(value);
	} else {
		qs[key] = [existing, value] as IDataObject[string];
	}
}

/**
 * Appends user-defined search filters to the request query string.
 * AMALIA list endpoints accept an arbitrary `search` object; each filter
 * becomes a query parameter (repeated keys are supported for arrays).
 */
async function attachFilters(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const filters = this.getNodeParameter('filters', {}) as {
		filter?: Array<{ name: string; value: string }>;
	};

	const entries = filters.filter ?? [];
	if (entries.length === 0) {
		return requestOptions;
	}

	const qs = (requestOptions.qs ?? {}) as IDataObject;
	for (const { name, value } of entries) {
		if (!name) {
			continue;
		}
		appendQs(qs, name, value);
	}
	requestOptions.qs = qs;
	return requestOptions;
}

/**
 * Shared properties for a SpringData-backed "Get Many" operation.
 * Handles Return All (page-based pagination), Limit (`size`), Sort and Filters.
 * Pass the resource name so `displayOptions` only shows them for that resource.
 * Set `genericFilters: false` to omit the generic Name/Value Filters collection
 * (e.g. when a resource supplies its own typed/visual filter UI).
 */
export function listProperties(
	resource: string,
	opts: { genericFilters?: boolean } = {},
): INodeProperties[] {
	const { genericFilters = true } = opts;
	const show = { operation: ['getAll'], resource: [resource] };

	const properties: INodeProperties[] = [
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			displayOptions: { show },
			default: false,
			description: 'Whether to return all results or only up to a given limit',
			routing: {
				send: { paginate: '={{ $value }}' },
				operations: {
					pagination: {
						type: 'generic',
						properties: {
							continue:
								'={{ $response.body.items.length > 0 && ($response.body.page + 1) * $response.body.itemsPerPage < $response.body.totalRows }}',
							request: {
								qs: {
									page: '={{ $pageCount }}',
									size: 100,
								},
							},
						},
					},
				},
			},
		},
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			displayOptions: { show: { ...show, returnAll: [false] } },
			typeOptions: { minValue: 1 },
			default: 50,
			description: 'Max number of results to return',
			routing: {
				send: { type: 'query', property: 'size' },
				output: { maxResults: '={{ $value }}' },
			},
		},
		{
			displayName: 'Sort',
			name: 'sort',
			type: 'string',
			displayOptions: { show },
			default: '',
			placeholder: 'numero,ASC',
			description: 'Sort expression in SpringData format, e.g. <code>numero,ASC</code>',
			routing: {
				send: {
					type: 'query',
					property: 'sort',
					value: '={{ $value || undefined }}',
				},
			},
		},
	];

	if (genericFilters) {
		properties.push({
			displayName: 'Filters',
			name: 'filters',
			type: 'fixedCollection',
			placeholder: 'Add Filter',
			typeOptions: { multipleValues: true },
			displayOptions: { show },
			default: {},
			description: 'Search parameters sent as query string fields',
			options: [
				{
					name: 'filter',
					displayName: 'Filter',
					values: [
						{
							displayName: 'Name',
							name: 'name',
							type: 'string',
							default: '',
							description: 'Query parameter name',
						},
						{
							displayName: 'Value',
							name: 'value',
							type: 'string',
							default: '',
							description: 'Query parameter value',
						},
					],
				},
			],
			routing: {
				send: { preSend: [attachFilters] },
			},
		});
	}

	return properties;
}

/** Output extractor: AMALIA list responses wrap rows in an `items` array. */
export const listOutput = {
	output: {
		postReceive: [
			{
				type: 'rootProperty' as const,
				properties: { property: 'items' },
			},
			castDateFields,
		],
	},
};
