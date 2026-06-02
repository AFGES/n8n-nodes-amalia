import type {
	IDataObject,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	INodeProperties,
} from 'n8n-workflow';

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
		const existing = qs[name];
		if (existing === undefined) {
			qs[name] = value;
		} else if (Array.isArray(existing)) {
			(existing as string[]).push(value);
		} else {
			qs[name] = [existing as string, value];
		}
	}
	requestOptions.qs = qs;
	return requestOptions;
}

/**
 * Shared properties for a SpringData-backed "Get Many" operation.
 * Handles Return All (page-based pagination), Limit (`size`), Sort and Filters.
 * Pass the resource name so `displayOptions` only shows them for that resource.
 */
export function listProperties(resource: string): INodeProperties[] {
	const show = { operation: ['getAll'], resource: [resource] };

	return [
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
		{
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
		},
	];
}

/** Output extractor: AMALIA list responses wrap rows in an `items` array. */
export const listOutput = {
	output: {
		postReceive: [
			{
				type: 'rootProperty' as const,
				properties: { property: 'items' },
			},
		],
	},
};
