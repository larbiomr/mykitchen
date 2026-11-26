# 🍳 MyKitchen

[![CI/CD](https://github.com/larbiomr/mykitchen/actions/workflows/deploy.yml/badge.svg)](https://github.com/larbiomr/mykitchen/actions/workflows/deploy.yml)
[![Lighthouse](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/larbiomr/mykitchen/badges/lighthouse.json)](https://github.com/larbiomr/mykitchen/actions/workflows/deploy.yml)
[![Netlify](https://img.shields.io/github/deployments/larbiomr/mykitchen/production?label=netlify)](https://github.com/larbiomr/mykitchen/deployments)

Application web installable (PWA) pour étudiants : cuisiner avec ce qu'on a.

## Fonctionnalités

- **Mon frigo** : ingrédients par catégorie, dates de péremption
- **Que cuisiner ?** : recettes classées selon les ingrédients disponibles, filtres
- **Liste de courses** : ingrédients manquants des favoris et ajouts manuels
- **Surprise** et **Favoris**
- 25 recettes, hors ligne, sans framework ; les données restent dans le navigateur

## Développement

```bash
python3 -m http.server 8000        # http://localhost:8000
node tests/suite.mjs               # tests
python3 scripts/ci_checks.py security
python3 scripts/ci_checks.py pwa
```

À chaque modification d'un fichier de l'application, incrémenter `CACHE` dans `sw.js`.

## Pipeline

| Étape | Contrôle | Bloque le déploiement |
|---|---|---|
| Sécurité | Secrets en dur, CSP, en-têtes, DOM dangereux | Oui |
| Qualité | Validation HTML (HTMLHint), PWA, tests | Oui |
| Lighthouse | Performance et accessibilité ≥ 80 | Oui |
| Lighthouse | Bonnes pratiques ≥ 80 | Non (avertissement) |
| Déploiement | Netlify, branche `main` | — |

Lighthouse 12 n'a plus de catégorie PWA : `scripts/ci_checks.py pwa` la remplace.

La configuration des secrets Netlify est décrite dans [SETUP.md](SETUP.md).
