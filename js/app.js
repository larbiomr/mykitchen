// Initialisation, routage par ancre et pages de l'application.
import { RECIPES } from './recipes.js';
import * as stock from './storage.js';
import * as m from './matching.js';
import { el, formatDuree, pastille, boutonFavori, carteRecette, grille, etatVide, toast, annoncer } from './ui.js';

const vue = document.getElementById('vue');
const ECHEC = 'Enregistrement impossible sur cet appareil.';
const NOMS_CATEGORIES = { frigo: 'Frigo', placard: 'Placard', epices: 'Épices' };
const SUGGESTIONS = [
  ['œuf', 'frigo'], ['lait', 'frigo'], ['beurre', 'frigo'], ['fromage', 'frigo'], ['yaourt', 'frigo'], ['tomate', 'frigo'], ['carotte', 'frigo'],
  ['pâtes', 'placard'], ['riz', 'placard'], ['pain', 'placard'], ['farine', 'placard'], ['sucre', 'placard'], ['oignon', 'placard'], ['banane', 'placard'], ['huile', 'placard'],
];
// Catégorie habituelle de chaque ingrédient connu
const CATALOGUE = new Map(RECIPES.flatMap((r) => r.ingredients).filter((i) => i.name !== 'eau').map((i) => [i.name, i.category]));

// État conservé pendant la navigation
const filtres = { appareil: '', duree: 0, repas: '', complet: false };
const surprise = { humeur: '', ids: [] };
const etapesFaites = new Map();
const portionsChoisies = new Map();
// Saisies en cours : elles survivent aux redessins (coche, suggestion, autre onglet)
const brouillon = { frigo: 'frigo', courses: 'placard', frigoNom: '', frigoDate: '', coursesNom: '' };

/** Affiche le résultat d'une écriture puis redessine la page. */
function enregistrer(ok, message) {
  if (!ok) toast(ECHEC);
  else if (message) toast(message);
  afficher();
}

function basculerFavori(recette) {
  const { favorite, saved } = stock.toggleFavorite(recette.id);
  enregistrer(saved, favorite ? 'Recette sauvegardée' : 'Recette retirée des favoris');
}

const boutonCoeur = (r) => boutonFavori(stock.getFavorites().includes(r.id), r.name, () => basculerFavori(r), `fav-${r.id}`);

function cartes(recettes) {
  const dispo = m.disponibles(stock.getFridge());
  return grille(recettes.map((r) => carteRecette(r, {
    pourcentage: m.analyser(r, dispo).pourcentage,
    duree: m.dureeTotale(r),
    favori: boutonCoeur(r),
  })));
}

const choixCategorie = (valeur, action) => el('select', { 'aria-label': 'Catégorie', onchange: action },
  Object.entries(NOMS_CATEGORIES).map(([cle, nom]) => el('option', { value: cle, selected: cle === valeur }, nom)));

// ----- Onglet 1 : Mon frigo -----
function pageFrigo() {
  const frigo = stock.getFridge();
  const aujourdHui = m.dateDuJour();
  const nom = el('input', { type: 'text', required: true, maxlength: 60, list: 'catalogue', placeholder: 'Ingrédient…', 'aria-label': 'Nom de l’ingrédient', 'data-focus': 'frigo-nom', value: brouillon.frigoNom });
  const categorie = choixCategorie(brouillon.frigo, (e) => { brouillon.frigo = e.target.value; });
  const date = el('input', { type: 'date', id: 'peremption', 'data-focus': 'frigo-date', value: brouillon.frigoDate });
  date.addEventListener('input', () => { brouillon.frigoDate = date.value; });
  nom.addEventListener('input', () => {
    brouillon.frigoNom = nom.value;
    const connue = CATALOGUE.get(nom.value.trim().toLowerCase());
    if (connue) { categorie.value = connue; brouillon.frigo = connue; }
  });

  const formulaire = el('form', {
    class: 'bloc formulaire',
    onsubmit: (e) => {
      e.preventDefault();
      if (!nom.value.trim()) return toast('Indique un nom d’ingrédient.');
      const ok = stock.addToFridge({ name: nom.value, category: categorie.value, expiry: date.value });
      if (ok) Object.assign(brouillon, { frigoNom: '', frigoDate: '' });
      return enregistrer(ok, 'Ingrédient ajouté');
    },
  },
  nom, categorie,
  el('label', { for: 'peremption' }, 'Péremption (facultatif)'), date,
  el('button', { class: 'bouton', 'data-focus': 'frigo-ajouter' }, 'Ajouter'),
  el('datalist', { id: 'catalogue' }, [...CATALOGUE.keys()].sort().map((n) => el('option', { value: n }))));

  const presents = new Set(frigo.map((a) => m.normaliser(a.name)));
  const rapides = SUGGESTIONS.filter(([n]) => !presents.has(m.normaliser(n)))
    .map(([n, c]) => pastille(`+ ${n}`, false, () => enregistrer(stock.addToFridge({ name: n, category: c }), `${n} : ajouté`), `sugg-${n}`));

  const sections = Object.entries(NOMS_CATEGORIES).map(([cle, titre]) => {
    const liste = frigo.filter((a) => a.category === cle);
    if (!liste.length) return null;
    return el('section', { class: 'bloc' }, el('h2', {}, titre),
      el('ul', { class: 'liste' }, liste.map((a) => {
        const perime = m.estPerime(a, aujourdHui);
        const quand = a.expiry ? a.expiry.split('-').reverse().join('/') : '';
        return el('li', { class: perime ? 'perime' : '' },
          el('span', { class: 'article' }, a.name,
            quand && el('small', {}, perime ? `⚠ Périmé depuis le ${quand}` : `À consommer avant le ${quand}`)),
          el('button', { type: 'button', class: 'rond', 'aria-label': `Supprimer ${a.name}`, 'data-focus': `suppr-${a.id}`,onclick: () => enregistrer(stock.removeFromFridge(a.id), 'Ingrédient supprimé') }, '×'));
      })));
  });

  return ['Mon frigo', formulaire,
    rapides.length ? el('div', { class: 'pastilles', role: 'group', 'aria-label': 'Ajouts rapides' }, rapides) : null,
    frigo.length ? sections : etatVide('Ton frigo est vide. Ajoute ce que tu as sous la main.')];
}

// ----- Onglet 2 : Que cuisiner ? -----
function groupeFiltres(titre, cle, options, vide) {
  return el('div', { class: 'pastilles', role: 'group', 'aria-label': titre },
    options.map(([valeur, nom]) => pastille(nom, filtres[cle] === valeur, () => {
      filtres[cle] = filtres[cle] === valeur ? vide : valeur;
      appliquerFiltres();
    }, `${cle}-${valeur}`)));
}

let resumeResultats = '';

/** Redessine la liste filtrée et annonce le nombre de résultats. */
function appliquerFiltres() {
  afficher();
  annoncer(resumeResultats);
}

function reinitialiserFiltres() {
  Object.assign(filtres, { appareil: '', duree: 0, repas: '', complet: false });
  appliquerFiltres();
  vue.focus({ preventScroll: true });
}

function pageCuisiner() {
  const dispo = m.disponibles(stock.getFridge());
  const liste = m.filtrer(RECIPES, filtres)
    .map((r) => ({ r, score: m.analyser(r, dispo).pourcentage }))
    .filter(({ score }) => !filtres.complet || score === 100)
    .sort((a, b) => b.score - a.score || m.dureeTotale(a.r) - m.dureeTotale(b.r))
    .map(({ r }) => r);
  resumeResultats = `${liste.length} recette${liste.length > 1 ? 's' : ''}`;
  const filtreActif = filtres.appareil || filtres.duree || filtres.repas || filtres.complet;

  return ['Que cuisiner ?',
    el('button', { type: 'button', class: 'bouton large', 'data-focus': 'complet', onclick: () => { filtres.complet = !filtres.complet; appliquerFiltres(); } },
      filtres.complet ? '✓ Seulement à 100 % — tout afficher' : '🍳 Je cuisine ça maintenant (100 %)'),
    groupeFiltres('Appareil', 'appareil', [['four', 'Four'], ['micro-onde', 'Micro-ondes'], ['plaques', 'Plaques'], ['sans-cuisson', 'Sans cuisson']], ''),
    // Les limites sont strictes (durée totale inférieure au seuil)
    groupeFiltres('Durée totale', 'duree', [[5, '< 5 min'], [15, '< 15 min'], [30, '< 30 min']], 0),
    groupeFiltres('Repas', 'repas', [['petit-dej', 'Petit-déj'], ['dejeuner', 'Déjeuner'], ['diner', 'Dîner'], ['snack', 'Snack']], ''),
    el('p', { class: 'discret' }, resumeResultats),
    liste.length ? cartes(liste) : etatVide(filtres.complet ? 'Aucune recette complète : ajoute des ingrédients ou retire un filtre.' : 'Aucune recette avec ces filtres.',
      filtreActif && el('button', { type: 'button', class: 'bouton', onclick: reinitialiserFiltres }, 'Réinitialiser les filtres'))];
}

// ----- Vue : recette détaillée -----
function pageRecette(recette) {
  const portions = portionsChoisies.get(recette.id) ?? recette.servings;
  const facteur = portions / recette.servings;
  const manquants = new Set(m.analyser(recette, m.disponibles(stock.getFridge())).manquants);
  const faites = etapesFaites.get(recette.id) ?? new Set();
  etapesFaites.set(recette.id, faites);
  const changer = (n) => { portionsChoisies.set(recette.id, n); afficher(); };

  // Retour à la page précédente (indispensable en mode application installée)
  const retour = () => { if (aNavigue) history.back(); else location.hash = '#/cuisiner'; };

  return [recette.name,
    el('button', { type: 'button', class: 'pastille retour', onclick: retour }, '← Retour'),
    el('div', { class: 'fiche-entete' },
      el('span', { class: 'carte-emoji', 'aria-hidden': 'true' }, recette.emoji),
      el('p', {}, recette.description), boutonCoeur(recette)),
    el('dl', { class: 'stats' }, [
      ['Préparation', formatDuree(recette.time_prep)], ['Cuisson', formatDuree(recette.time_cook)],
      ['Niveau', recette.difficulty], ['Calories', `≈ ${recette.calories} kcal / portion`],
    ].map(([nom, valeur]) => el('div', {}, el('dt', {}, nom), el('dd', {}, valeur)))),
    el('div', { class: 'fiche' },
      el('section', { class: 'bloc' }, el('h2', {}, 'Ingrédients'),
        el('div', { class: 'pastilles', role: 'group', 'aria-label': 'Portions' },
          [1, 2, 3, 4].map((n) => pastille(`${n} pers.`, n === portions, () => changer(n), `portions-${n}`))),
        el('ul', { class: 'liste' }, recette.ingredients.map((i) => el('li', { class: manquants.has(i) ? 'manquant' : '' },
          el('span', { class: 'article' }, i.name, manquants.has(i) && el('small', {}, 'manquant')),
          el('strong', {}, m.formatQuantite(i.quantity * facteur, i.unit))))),
        portions > 1 && recette.time_cook > 0 && el('p', { class: 'discret' }, 'Pour plusieurs portions, les temps de cuisson peuvent s’allonger (surtout au micro-ondes).')),
      el('section', { class: 'bloc' }, el('h2', {}, 'Préparation'),
        el('ol', { class: 'etapes' }, recette.steps.map((etape, index) => el('li', {}, el('label', {},
          el('input', {
            type: 'checkbox',
            checked: faites.has(index),
            onchange: (e) => { if (e.target.checked) faites.add(index); else faites.delete(index); },
          }),
          el('span', {}, `${index + 1}. ${etape}`))))))),
  ];
}

// ----- Onglet 3 : Liste de courses -----
/** Copie un texte, avec une méthode de secours si le presse-papiers est refusé. */
async function copier(texte) {
  try {
    await navigator.clipboard.writeText(texte);
    return true;
  } catch {
    const precedent = document.activeElement;
    // Lecture seule : évite l'ouverture du clavier virtuel
    const zone = el('textarea', { class: 'hors-ecran', readonly: true });
    zone.value = texte;
    document.body.append(zone);
    zone.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    zone.remove();
    precedent?.focus?.({ preventScroll: true });
    return ok;
  }
}

/** Lignes de la liste : ingrédients manquants des favoris puis ajouts manuels. */
function lignesCourses() {
  const favoris = stock.getFavorites();
  const auto = m.coursesAuto(RECIPES.filter((r) => favoris.includes(r.id)), m.disponibles(stock.getFridge()));
  const manuels = stock.getManualItems();
  return [
    // La quantité fait partie de la clé : si elle change, l'article revient décoché
    ...auto.map((a) => ({ ...a, cle: `${a.key}|${a.quantity}`, detail: m.formatQuantite(a.quantity, a.unit) })),
    ...manuels.map((a) => ({ ...a, cle: a.id, detail: '', manuel: true })),
  ];
}

function pageCourses() {
  const lignes = lignesCourses();
  const coches = new Set(stock.getChecked());

  const nom = el('input', { type: 'text', required: true, maxlength: 60, placeholder: 'Ajouter un article…', 'aria-label': 'Article à ajouter', 'data-focus': 'courses-nom', value: brouillon.coursesNom });
  nom.addEventListener('input', () => { brouillon.coursesNom = nom.value; });
  const categorie = choixCategorie(brouillon.courses, (e) => { brouillon.courses = e.target.value; });
  const formulaire = el('form', {
    class: 'bloc formulaire',
    onsubmit: (e) => {
      e.preventDefault();
      if (!nom.value.trim()) return toast('Indique un nom d’article.');
      const ok = stock.addManualItem({ name: nom.value, category: categorie.value });
      if (ok) brouillon.coursesNom = '';
      return enregistrer(ok, 'Article ajouté');
    },
  }, nom, categorie, el('button', { class: 'bouton', 'data-focus': 'courses-ajouter' }, 'Ajouter'));

  const groupes = Object.entries(NOMS_CATEGORIES)
    .map(([cle, titre]) => [titre, lignes.filter((l) => l.category === cle)])
    .filter(([, liste]) => liste.length);

  // Texte à copier : seuls les articles non cochés
  const enTexte = () => groupes.map(([titre, liste]) => {
    const restants = liste.filter((l) => !coches.has(l.cle));
    return restants.length ? `${titre}\n${restants.map((l) => `- ${l.name}${l.detail ? ` (${l.detail})` : ''}`).join('\n')}` : '';
  }).filter(Boolean).join('\n\n');

  return ['Liste de courses',
    el('p', { class: 'discret' }, 'Les ingrédients manquants de tes favoris s’ajoutent automatiquement (une portion par recette).'),
    formulaire,
    groupes.map(([titre, liste]) => el('section', { class: 'bloc' }, el('h2', {}, titre),
      el('ul', { class: 'liste' }, liste.map((l) => el('li', {},
        el('label', {},
          el('input', { type: 'checkbox', checked: coches.has(l.cle), 'data-focus': `coche-${l.cle}`, onchange: () => enregistrer(stock.toggleChecked(l.cle)) }),
          el('span', { class: 'article' }, l.name),
          el('strong', {}, l.detail)),
        l.manuel && el('button', { type: 'button', class: 'rond', 'aria-label': `Supprimer ${l.name}`, 'data-focus': `suppr-${l.id}`,onclick: () => enregistrer(stock.removeManualItem(l.id), 'Article supprimé') }, '×')))))),
    lignes.length
      ? el('button', {
        type: 'button',
        class: 'bouton large',
        onclick: async () => {
          const texte = enTexte();
          if (!texte) return toast('Tout est déjà coché.');
          return toast(await copier(texte) ? 'Liste copiée' : 'Copie impossible sur cet appareil.');
        },
      }, 'Copier en texte')
      : etatVide('Rien à acheter pour le moment.')];
}

// ----- Onglet 4 : Surprise -----
function relancer() {
  const bassin = RECIPES.filter((r) => m.correspondHumeur(r, surprise.humeur));
  surprise.ids = m.tirer(bassin, 3, surprise.ids).map((r) => r.id);
}

function pageSurprise() {
  if (!surprise.ids.length) relancer();
  const choisies = surprise.ids.map((id) => RECIPES.find((r) => r.id === id));
  const humeurs = [['rapide', 'Rapide'], ['comfort', 'Comfort food'], ['healthy', 'Healthy'], ['sans-cuisson', 'Sans cuisson']];
  return ['J’sais pas quoi manger',
    el('div', { class: 'pastilles', role: 'group', 'aria-label': 'Humeur' }, humeurs.map(([valeur, nom]) => pastille(nom, surprise.humeur === valeur, () => {
      surprise.humeur = surprise.humeur === valeur ? '' : valeur;
      surprise.ids = [];
      afficher();
    }, `humeur-${valeur}`))),
    cartes(choisies),
    el('button', {
      type: 'button',
      class: 'bouton large',
      'data-focus': 'relancer',
      onclick: () => {
        relancer();
        afficher();
        annoncer(`Nouvelles suggestions : ${surprise.ids.map((id) => RECIPES.find((r) => r.id === id).name).join(', ')}`);
      },
    }, '🎲 Relancer')];
}

// ----- Onglet 5 : Favoris -----
function pageFavoris() {
  const ids = stock.getFavorites();
  const liste = RECIPES.filter((r) => ids.includes(r.id));
  return ['Favoris', liste.length ? cartes(liste) : etatVide('Touche ♡ sur une recette pour la retrouver ici.',
    el('a', { class: 'bouton action-vide', href: '#/cuisiner' }, 'Voir les recettes'))];
}

// ----- Routage -----
const PAGES = { frigo: pageFrigo, cuisiner: pageCuisiner, courses: pageCourses, surprise: pageSurprise, favoris: pageFavoris };

/** Dessine la page de l'ancre courante en conservant le focus clavier. */
function afficher() {
  const [, page = '', id] = location.hash.split('/');
  const cle = document.activeElement?.dataset?.focus;
  // Après chaque changement, même hors de l'onglet Courses, les coches obsolètes sont oubliées
  stock.pruneChecked(lignesCourses().map((l) => l.cle));
  let contenu;
  if (page === 'recette') {
    const recette = RECIPES.find((r) => r.id === id);
    contenu = recette ? pageRecette(recette) : ['Introuvable', etatVide('Cette recette n’existe pas.',
      el('a', { class: 'bouton action-vide', href: '#/cuisiner' }, 'Voir les recettes'))];
  } else contenu = (Object.hasOwn(PAGES, page) ? PAGES[page] : pageFrigo)();

  const [titre, ...elements] = contenu;
  vue.replaceChildren(el('h1', {}, titre), ...elements.flat().filter(Boolean));
  document.title = `${titre} — MyKitchen`;

  const onglet = Object.hasOwn(PAGES, page) ? page : page === 'recette' ? 'cuisiner' : 'frigo';
  for (const lien of document.querySelectorAll('.nav a')) {
    if (lien.getAttribute('href') === `#/${onglet}`) lien.setAttribute('aria-current', 'page');
    else lien.removeAttribute('aria-current');
  }
  if (cle) (vue.querySelector(`[data-focus="${CSS.escape(cle)}"]`) ?? vue).focus({ preventScroll: true });
}

// Vrai dès qu'une navigation interne a eu lieu (pour le bouton « Retour »)
let aNavigue = false;

window.addEventListener('hashchange', () => {
  aNavigue = true;
  afficher();
  // Relance la transition d'entrée
  vue.classList.remove('entree');
  void vue.offsetWidth;
  vue.classList.add('entree');
  vue.focus({ preventScroll: true });
  window.scrollTo(0, 0);
});
// Données modifiées dans un autre onglet du navigateur
window.addEventListener('storage', afficher);
// Les dates de péremption sont réévaluées au retour dans l'application
// (sans effacer une saisie en cours)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && !location.hash.startsWith('#/recette') && !vue.querySelector('input[type="text"]')?.value) afficher();
});
afficher();

// Fonctionnement hors ligne
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch((erreur) => console.warn('Service worker indisponible', erreur));
  // Les polices chargées avant le service worker lui sont signalées pour le hors ligne
  navigator.serviceWorker.ready.then(async ({ active }) => {
    await document.fonts.ready;
    const polices = performance.getEntriesByType('resource').map((r) => r.name).filter((n) => n.startsWith('https://fonts.g'));
    active.postMessage({ polices });
  }).catch((erreur) => console.warn('Polices non mises en cache', erreur));
}
