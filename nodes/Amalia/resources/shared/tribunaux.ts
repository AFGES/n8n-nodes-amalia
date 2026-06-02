import type { IExecuteSingleFunctions, ILoadOptionsFunctions } from 'n8n-workflow';

/**
 * Fetches the tribunaux the authenticated user has access to from
 * `/constantes` — the same source the web client seeds its association search
 * from. Used both to populate the Tribunal dropdown (loadOptions) and to
 * default the mandatory `tribunal` filter to "all" when the user leaves it
 * unset.
 */
export async function fetchTribunaux(
	this: IExecuteSingleFunctions | ILoadOptionsFunctions,
): Promise<Array<{ id: number; libelle: string }>> {
	const credentials = await this.getCredentials('amaliaApi');
	const baseUrl = String(credentials.baseUrl).replace(/\/+$/, '');
	const constantes = (await this.helpers.httpRequestWithAuthentication.call(this, 'amaliaApi', {
		method: 'GET',
		url: `${baseUrl}/api/constantes`,
		json: true,
	})) as { tribunaux?: Array<{ id: number; libelle: string }> };
	return constantes.tribunaux ?? [];
}
