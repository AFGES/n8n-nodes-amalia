# @afges/n8n-nodes-amalia

This is an n8n community node. It lets you read data from the AMALIA registry in your n8n workflows.

AMALIA is the online registry of associations for Alsace-Moselle local law ([associations.alsace-moselle.fr](https://associations.alsace-moselle.fr)). This node gives read-only access to associations, requests (filings) and the documents attached to them.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)
[Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation, using the package name `@afges/n8n-nodes-amalia`.

## Operations

All operations are read-only.

| Resource    | Operation  | Description                                      |
| ----------- | ---------- | ------------------------------------------------ |
| Association | Get Many   | List and search associations                     |
| Association | Get        | Get one association by its number                |
| Request     | Get Many   | List requests                                    |
| Request     | Get        | Get one request by its number                    |
| Request     | Get Depot  | Get a temporary deposit (depot) by its ID        |
| Piece       | Get        | Get one document piece of a request              |

Creating or modifying associations and requests, and uploading documents, is not supported.

## Credentials

You need an account on the AMALIA registry. Create one on the instance you want to use.

Authentication uses your AMALIA login. Create an **AMALIA API** credential with:

- **Username**: the email address of your account.
- **Password**: your account password.
- **Base URL**: root URL of the registry. Defaults to `https://associations.alsace-moselle.fr`.

The node signs in on your behalf (OAuth2 authorization code flow with PKCE), stores the access and refresh tokens in the credential, and renews them automatically when they expire. The credential test calls `/api/constantes`.

## Compatibility

Requires an n8n version that supports community nodes (`n8nNodesApiVersion` 1). The node can also be used as a tool by AI agents (`usableAsTool`).

## Usage

### Get Many

- **Return All** fetches every page (100 rows per request). Otherwise **Limit** caps the number of results (default 50).
- **Sort** takes a SpringData expression, for example `numero,ASC`.
- **Association** filters are exact-match conditions combined with AND: Name, Number, Address, Commune, Postal Code, Volume, Folio, States, Tribunal and Mine Only. If you set no States or Tribunal filter, all states and all tribunals available to your account are searched, because the API returns nothing without them.
- **Request** filters are free-form query parameters (name/value pairs) sent to the API.

### Get association

Returns the association with its most recent version merged into the `association` field. Enable **Show Version History** to get every version, newest first, under `version` instead.

### Dates

Any field whose name starts with `date` is returned as a date object.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [AMALIA registry](https://associations.alsace-moselle.fr)

## Version history

See [CHANGELOG.md](CHANGELOG.md).
