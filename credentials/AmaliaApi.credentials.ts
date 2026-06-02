import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class AmaliaApi implements ICredentialType {
	name = 'amaliaApi';

	displayName = 'amalia API';

	// Link to your community node's README
	documentationUrl = 'https://github.com/org/@afges/-amalia?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			body: {
				token: '={{$credentials.accessToken}}',
			},
			qs: {
				token: '={{$credentials.accessToken}}',
			},
			headers: {
				Authorization: '=Bearer {{$credentials.accessToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://associations.alsace-moselle.fr/api',
			url: '/v1/user',
		},
	};
}
