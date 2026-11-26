# Configuration du déploiement Netlify

À faire une seule fois, depuis le dossier du projet.

## 1. Créer le site Netlify

```bash
netlify sites:create --name <nom-unique>
```

Noter le **Project ID** (ou *Site ID*) affiché. Ne pas activer de build depuis Git côté Netlify :
le déploiement passe uniquement par GitHub Actions, sinon les contrôles seraient contournés.

## 2. Créer un jeton Netlify

Netlify → avatar → **User settings** → **Applications** → **Personal access tokens** →
**New access token**. Lui donner une date d'expiration et copier la valeur.

## 3. Ajouter les secrets GitHub

La commande demande la valeur : elle n'apparaît ni à l'écran ni dans l'historique du terminal.

```bash
gh secret set NETLIFY_AUTH_TOKEN --repo larbiomr/mykitchen
gh secret set NETLIFY_SITE_ID --repo larbiomr/mykitchen
gh secret list --repo larbiomr/mykitchen
```

Par l'interface : dépôt → **Settings** → **Secrets and variables** → **Actions** →
**New repository secret**.

Ne jamais écrire le jeton dans un fichier du dépôt ni le coller dans une conversation.

## 4. Relancer le pipeline

```bash
gh workflow run deploy.yml --repo larbiomr/mykitchen
gh run watch --repo larbiomr/mykitchen
```

## Badge Netlify natif (facultatif)

Le badge « netlify » du README reflète l'environnement GitHub `production`. Pour afficher celui
de Netlify, remplacer son image par
`https://api.netlify.com/api/v1/badges/<Site ID>/deploy-status`
(l'extrait exact figure dans les réglages du site, section *Status badges*). Il est conçu pour les
builds lancés par Netlify : vérifier qu'il suit bien les déploiements envoyés par la CI.
