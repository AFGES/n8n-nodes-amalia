# @afges/n8n-nodes-amalia

> Nœud communautaire n8n pour le registre AMALIA — associations de droit local d'Alsace-Moselle.
> n8n community node for the AMALIA registry — Alsace-Moselle local-law associations.

[Français](#français) · [English](#english)

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

---

## Français

Nœud communautaire [n8n](https://n8n.io) pour lire les données du registre AMALIA.
AMALIA est le registre en ligne des associations de droit local d'Alsace-Moselle
([associations.alsace-moselle.fr](https://associations.alsace-moselle.fr)). Ce nœud donne un
accès en lecture seule aux associations, aux requêtes (dépôts) et aux pièces qui y sont jointes.

### Installation

Suivez le [guide d'installation des nœuds communautaires](https://docs.n8n.io/integrations/community-nodes/installation/)
de n8n.

Dans n8n : **Settings → Community Nodes → Install**, puis saisissez le nom du paquet :

```
@afges/n8n-nodes-amalia
```

Installation manuelle (instance auto-hébergée) :

```bash
npm install @afges/n8n-nodes-amalia
```

### Identifiants (Credentials)

Il vous faut un compte sur le registre AMALIA. Créez-le sur l'instance que vous voulez utiliser.

L'authentification utilise votre connexion AMALIA. Créez des identifiants **AMALIA API** avec :

- **Username** : l'adresse email de votre compte ;
- **Password** : le mot de passe de votre compte ;
- **Base URL** : URL racine du registre. Par défaut `https://associations.alsace-moselle.fr`.

Le nœud se connecte pour vous (flux OAuth2 _authorization code_ avec PKCE), stocke les jetons
d'accès et de rafraîchissement dans les identifiants et les renouvelle automatiquement à
expiration. Les identifiants sont validés via un appel à `/api/constantes`.

### Opérations

Toutes les opérations sont en lecture seule.

| Ressource             | Opération | Description                                      |
| --------------------- | --------- | ------------------------------------------------ |
| **Association**       | Get Many  | Liste et recherche les associations              |
| **Association**       | Get       | Récupère une association par son numéro          |
| **Requête** (Request) | Get Many  | Liste les requêtes                               |
| **Requête** (Request) | Get       | Récupère une requête par son numéro              |
| **Requête** (Request) | Get Depot | Récupère un dépôt temporaire par son identifiant |
| **Pièce** (Piece)     | Get       | Récupère une pièce d'une requête                 |

La création ou la modification d'associations et de requêtes, ainsi que l'envoi de documents,
ne sont pas pris en charge.

### Fonctionnalités

- **Get Many** : _Return All_ récupère toutes les pages (100 lignes par requête). Sinon,
  _Limit_ borne le nombre de résultats (50 par défaut).
- **Tri** : expression SpringData, par exemple `numero,ASC`.
- **Filtres Association** : conditions exactes combinées par ET — Nom, Numéro, Adresse,
  Commune, Code postal, Volume, Folio, États, Tribunal et _Mine Only_. Sans filtre États ou
  Tribunal, tous les états et tous les tribunaux accessibles à votre compte sont interrogés,
  car l'API ne renvoie rien sans eux.
- **Filtres Requête** : paramètres de requête libres (paires nom/valeur) envoyés à l'API.
- **Get Association** : renvoie l'association avec sa version la plus récente fusionnée dans le
  champ `association`. Activez _Show Version History_ pour obtenir toutes les versions, de la
  plus récente à la plus ancienne, dans `version`.
- **Dates** : tout champ dont le nom commence par `date` est renvoyé sous forme de date.
- **Traduction française** de l'interface du nœud.
- Le nœud est utilisable comme **outil** (`usableAsTool`) dans les workflows IA d'n8n.

### Compatibilité

- API des nœuds n8n version 1, mode `strict`.
- Nécessite une instance n8n prenant en charge les nœuds communautaires.

### Exemple d'utilisation

1. Ajoutez le nœud **AMALIA** et sélectionnez vos identifiants.
2. Ressource **Association** → opération **Get Many**.
3. Ajoutez un filtre _Commune_ pour ne récupérer que les associations d'une commune.

### Ressources

- [Documentation des nœuds communautaires n8n](https://docs.n8n.io/integrations/community-nodes/)
- [Registre AMALIA](https://associations.alsace-moselle.fr)
- [Dépôt](https://git.afges.eu/n8n/n8n-nodes-amalia) (miroir [GitHub](https://github.com/AFGES/n8n-nodes-amalia))

### Historique des versions

Voir [CHANGELOG.md](CHANGELOG.md).

### Licence

[MIT](https://opensource.org/licenses/MIT).

---

## English

[n8n](https://n8n.io) community node to read data from the AMALIA registry.
AMALIA is the online registry of associations for Alsace-Moselle local law
([associations.alsace-moselle.fr](https://associations.alsace-moselle.fr)). This node gives
read-only access to associations, requests (filings) and the documents attached to them.

### Installation

Follow n8n's [community node installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

In n8n: **Settings → Community Nodes → Install**, then enter the package name:

```
@afges/n8n-nodes-amalia
```

Manual install (self-hosted instance):

```bash
npm install @afges/n8n-nodes-amalia
```

### Credentials

You need an account on the AMALIA registry. Create one on the instance you want to use.

Authentication uses your AMALIA login. Create an **AMALIA API** credential with:

- **Username**: the email address of your account;
- **Password**: your account password;
- **Base URL**: root URL of the registry. Defaults to `https://associations.alsace-moselle.fr`.

The node signs in on your behalf (OAuth2 authorization code flow with PKCE), stores the access
and refresh tokens in the credential, and renews them automatically when they expire.
Credentials are validated with a call to `/api/constantes`.

### Operations

All operations are read-only.

| Resource        | Operation | Description                               |
| --------------- | --------- | ----------------------------------------- |
| **Association** | Get Many  | List and search associations              |
| **Association** | Get       | Get one association by its number         |
| **Request**     | Get Many  | List requests                             |
| **Request**     | Get       | Get one request by its number             |
| **Request**     | Get Depot | Get a temporary deposit (depot) by its ID |
| **Piece**       | Get       | Get one document piece of a request       |

Creating or modifying associations and requests, and uploading documents, is not supported.

### Features

- **Get Many**: _Return All_ fetches every page (100 rows per request). Otherwise _Limit_
  caps the number of results (default 50).
- **Sort**: a SpringData expression, for example `numero,ASC`.
- **Association filters**: exact-match conditions combined with AND — Name, Number, Address,
  Commune, Postal Code, Volume, Folio, States, Tribunal and Mine Only. If you set no States or
  Tribunal filter, all states and all tribunals available to your account are searched,
  because the API returns nothing without them.
- **Request filters**: free-form query parameters (name/value pairs) sent to the API.
- **Get Association**: returns the association with its most recent version merged into the
  `association` field. Enable _Show Version History_ to get every version, newest first,
  under `version` instead.
- **Dates**: any field whose name starts with `date` is returned as a date object.
- **French translation** of the node UI.
- The node is **usable as a tool** (`usableAsTool`) in n8n AI workflows.

### Compatibility

- n8n nodes API version 1, `strict` mode.
- Requires an n8n instance that supports community nodes.

### Usage example

1. Add the **AMALIA** node and select your credentials.
2. Resource **Association** → operation **Get Many**.
3. Add a _Commune_ filter to fetch only the associations of one municipality.

### Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [AMALIA registry](https://associations.alsace-moselle.fr)
- [Repository](https://git.afges.eu/n8n/n8n-nodes-amalia) ([GitHub](https://github.com/AFGES/n8n-nodes-amalia) mirror)

### Version history

See [CHANGELOG.md](CHANGELOG.md).

### License

[MIT](https://opensource.org/licenses/MIT).
