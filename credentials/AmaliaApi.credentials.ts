import { createHash, randomBytes } from 'crypto';
import type {
	IAuthenticateGeneric,
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IDataObject,
	IHttpRequestHelper,
	IHttpRequestOptions,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

const CLIENT_ID = 'web';
const CLIENT_SECRET = 'web';
const SESSION_COOKIE = 'OAUTH2COOKIE';
const ALNUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function randomAlnum(length: number): string {
	const bytes = randomBytes(length);
	let out = '';
	for (let i = 0; i < length; i++) {
		out += ALNUM[bytes[i] % ALNUM.length];
	}
	return out;
}

function base64url(buffer: Buffer): string {
	return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// PKCE S256 challenge — mirrors association-externe-front/services/oauth2/OAuth2Service.js
function pkceChallenge(verifier: string): string {
	return base64url(createHash('sha256').update(verifier).digest());
}

function extractCookie(setCookie: unknown, name: string): string | undefined {
	const cookies = Array.isArray(setCookie)
		? (setCookie as string[])
		: typeof setCookie === 'string'
			? [setCookie]
			: [];
	for (const cookie of cookies) {
		const match = cookie.match(new RegExp(`${name}=([^;]+)`));
		if (match) return match[1];
	}
	return undefined;
}

export class AmaliaApi implements ICredentialType {
	name = 'amaliaApi';

	displayName = 'AMALIA API';

	documentationUrl = 'https://associations.alsace-moselle.fr';

	genericAuth = true;

	icon: Icon = 'file:../nodes/Amalia/amalia.svg';

	properties: INodeProperties[] = [
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			placeholder: 'name@email.com',
			required: true,
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://associations.alsace-moselle.fr',
			description: 'Root URL of the registry instance',
		},
		// Holds the OAuth2 tokens obtained by preAuthentication. Not user-editable.
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'hidden',
			typeOptions: { password: true },
			default: '',
		},
		{
			displayName: 'Refresh Token',
			name: 'refreshToken',
			type: 'hidden',
			typeOptions: { password: true },
			default: '',
		},
	];

	async preAuthentication(
		this: IHttpRequestHelper,
		credentials: ICredentialDataDecryptedObject,
	): Promise<IDataObject> {
		const baseUrl = (credentials.baseUrl as string).replace(/\/+$/, '');
		const redirectUri = `${baseUrl}/oauth_callback`;

		const tokenUrl = `${baseUrl}/oauth2/token`;

		// 1) Refresh path (preferred) — reuse the stored refresh_token if present.
		const refreshToken = credentials.refreshToken as string | undefined;
		if (refreshToken) {
			const refreshBody = new URLSearchParams({
				grant_type: 'refresh_token',
				refresh_token: refreshToken,
				client_id: CLIENT_ID,
				client_secret: CLIENT_SECRET,
			});
			const refreshResponse = await this.helpers.httpRequest({
				method: 'POST',
				url: tokenUrl,
				headers: { 'content-type': 'application/x-www-form-urlencoded' },
				body: refreshBody,
				ignoreHttpStatusErrors: true,
				returnFullResponse: true,
			} as IHttpRequestOptions);

			if (refreshResponse.statusCode < 400 && refreshResponse.body?.access_token) {
				return {
					accessToken: refreshResponse.body.access_token,
					refreshToken: refreshResponse.body.refresh_token ?? refreshToken,
				};
			}
			// otherwise fall through to a full login
		}

		// 2) Login — POST the username/password form, capture the session cookie.
		const loginResponse = await this.helpers.httpRequest({
			method: 'POST',
			url: `${baseUrl}/oauthlogin`,
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				username: credentials.username as string,
				password: credentials.password as string,
			}),
			disableFollowRedirect: true,
			ignoreHttpStatusErrors: true,
			returnFullResponse: true,
		} as IHttpRequestOptions);

		const sessionCookie = extractCookie(loginResponse.headers['set-cookie'], SESSION_COOKIE);
		if (!sessionCookie) {
			throw new Error(`Login failed: no ${SESSION_COOKIE} session cookie returned by /oauthlogin.`);
		}
		// The session cookie is set even on a failed login — the redirect target is what
		// distinguishes success from failure (/oauthlogin sends ?error back to /login).
		const loginLocation = (loginResponse.headers.location as string | undefined) ?? '';
		if (/[?&]error\b/.test(loginLocation) || /\/login(\?|$)/.test(loginLocation)) {
			throw new Error('Login failed: invalid username or password.');
		}
		const cookieHeader = `${SESSION_COOKIE}=${sessionCookie}`;

		// 3) PKCE + authorize — exchange the session for an authorization code.
		const codeVerifier = randomAlnum(128);
		const state = randomAlnum(64);
		const authorizeResponse = await this.helpers.httpRequest({
			method: 'GET',
			url: `${baseUrl}/oauth2/authorize`,
			headers: { Cookie: cookieHeader },
			qs: {
				response_type: 'code',
				client_id: CLIENT_ID,
				redirect_uri: redirectUri,
				state,
				code_challenge: pkceChallenge(codeVerifier),
				code_challenge_method: 'S256',
			},
			disableFollowRedirect: true,
			ignoreHttpStatusErrors: true,
			returnFullResponse: true,
		} as IHttpRequestOptions);

		const location = authorizeResponse.headers.location as string | undefined;
		if (!location) {
			throw new Error(
				'Authorization failed: /oauth2/authorize did not redirect (no Location header). The session may be invalid or a consent step is required.',
			);
		}
		const callbackUrl = new URL(location, baseUrl);
		const code = callbackUrl.searchParams.get('code');
		const returnedState = callbackUrl.searchParams.get('state');
		if (!code) {
			throw new Error(`Authorization failed: no code in callback redirect (${location}).`);
		}
		if (returnedState !== state) {
			throw new Error('Authorization failed: state mismatch (possible CSRF).');
		}

		// 4) Token — exchange the authorization code for tokens.
		const tokenResponse = (await this.helpers.httpRequest({
			method: 'POST',
			url: tokenUrl,
			headers: {
				'content-type': 'application/x-www-form-urlencoded',
				Cookie: cookieHeader,
			},
			body: new URLSearchParams({
				grant_type: 'authorization_code',
				code,
				code_verifier: codeVerifier,
				redirect_uri: redirectUri,
				client_id: CLIENT_ID,
				client_secret: CLIENT_SECRET,
			}),
		} as IHttpRequestOptions)) as IDataObject;

		if (!tokenResponse.access_token) {
			throw new Error('Token exchange failed: no access_token in /oauth2/token response.');
		}

		return {
			accessToken: tokenResponse.access_token,
			refreshToken: tokenResponse.refresh_token ?? '',
		};
	}

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				// Only send a Bearer header when a token exists. preAuthentication mints the
				// token at execution time, so during the save-time credential test accessToken
				// is empty — emitting an empty header keeps the test endpoint happy (a tokenless
				// "Bearer" string would 401).
				Authorization: '={{$credentials.accessToken ? "Bearer " + $credentials.accessToken : ""}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/api/constantes',
			method: 'GET',
		},
	};
}
