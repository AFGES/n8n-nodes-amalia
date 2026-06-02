import type { INodeProperties } from 'n8n-workflow';

const showOnlyForLookups = {
	resource: ['lookup'],
};

export const lookupDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForLookups },
		options: [
			{
				name: 'Search Communes',
				value: 'communes',
				action: 'Search communes',
				description: 'Autocomplete communes by name',
				routing: {
					request: { method: 'GET', url: '/commune/autocomplete' },
				},
			},
			{
				name: 'Search Countries',
				value: 'countries',
				action: 'Search countries',
				description: 'Autocomplete countries (pays) by name',
				routing: {
					request: { method: 'GET', url: '/pays/autocomplete' },
				},
			},
			{
				name: 'Search Nationalities',
				value: 'nationalities',
				action: 'Search nationalities',
				description: 'Autocomplete nationalities by name',
				routing: {
					request: { method: 'GET', url: '/nationalites/autocomplete' },
				},
			},
		],
		default: 'communes',
	},
	{
		displayName: 'Name',
		name: 'nom',
		type: 'string',
		required: true,
		displayOptions: { show: showOnlyForLookups },
		default: '',
		description: 'The text to search for',
		routing: {
			send: { type: 'query', property: 'nom' },
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: { show: { ...showOnlyForLookups, operation: ['communes'] } },
		default: {},
		options: [
			{
				displayName: 'Postal Code',
				name: 'codePostal',
				type: 'string',
				default: '',
				routing: { send: { type: 'query', property: 'codePostal' } },
			},
			{
				displayName: 'Court (Tribunal)',
				name: 'tribunal',
				type: 'string',
				default: '',
				routing: { send: { type: 'query', property: 'tribunal' } },
			},
			{
				displayName: 'Out of Jurisdiction',
				name: 'horsCompetence',
				type: 'boolean',
				default: false,
				routing: { send: { type: 'query', property: 'horsCompetence' } },
			},
		],
	},
];
