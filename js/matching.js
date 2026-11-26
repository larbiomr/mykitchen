// Logique pure (sans DOM ni stockage) : correspondance, filtres, courses.

// Ingrédients supposés toujours disponibles
const BASIQUES = new Set(['eau', 'sel', 'poivre']);

// Variantes courantes ramenées au nom utilisé dans les recettes
const SYNONYMES = {
  spaghetti: 'pate', coquillette: 'pate', penne: 'pate',
  'fromage rape': 'fromage', emmental: 'fromage', gruyere: 'fromage',
  'pain de mie': 'pain', baguette: 'pain',
  thon: 'thon en boite', mai: 'mai en boite', salade: 'salade verte',
  poulet: 'blanc de poulet', jambon: 'jambon de dinde', nutella: 'pate a tartiner',
  'huile de tournesol': 'huile',
};

/** Forme comparable d'un nom : sans accents, ligatures ni pluriel. */
export function normaliser(nom) {
  const base = nom.toLowerCase().replaceAll('œ', 'oe').replaceAll('’', "'")
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .trim().split(/\s+/)
    .map((mot) => (mot.length > 3 ? mot.replace(/[sx]$/, '') : mot))
    .join(' ');
  return Object.hasOwn(SYNONYMES, base) ? SYNONYMES[base] : base;
}

/** Date du jour au format AAAA-MM-JJ, en heure locale. */
export function dateDuJour(date = new Date()) {
  const deux = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${deux(date.getMonth() + 1)}-${deux(date.getDate())}`;
}

export const estPerime = (article, aujourdHui = dateDuJour()) => Boolean(article.expiry) && article.expiry < aujourdHui;

/** Noms disponibles : les produits périmés ne comptent pas. */
export function disponibles(frigo, aujourdHui = dateDuJour()) {
  const noms = new Set(frigo.filter((a) => !estPerime(a, aujourdHui)).map((a) => normaliser(a.name)));
  // L'huile d'olive remplace l'huile neutre (l'inverse n'est pas supposé)
  if (noms.has("huile d'olive")) noms.add('huile');
  return noms;
}

export function analyser(recette, dispo) {
  const utiles = recette.ingredients.filter((i) => !BASIQUES.has(normaliser(i.name)));
  const manquants = utiles.filter((i) => !dispo.has(normaliser(i.name)));
  const possedes = utiles.length - manquants.length;
  // Arrondi vers le bas : 100 % signifie qu'il ne manque rien
  const pourcentage = utiles.length ? Math.floor((possedes / utiles.length) * 100) : 100;
  return { pourcentage, manquants };
}

export const dureeTotale = (recette) => recette.time_prep + recette.time_cook;

/** Filtres de l'onglet « Que cuisiner ? » ; une valeur vide est ignorée. */
export function filtrer(recettes, { appareil = '', duree = 0, repas = '' } = {}) {
  return recettes.filter((r) => (!appareil || r.appliances.includes(appareil))
    && (!duree || dureeTotale(r) < duree)
    && (!repas || r.meal_type.includes(repas)));
}

export function correspondHumeur(recette, humeur) {
  if (!humeur) return true;
  if (humeur === 'rapide') return dureeTotale(recette) <= 15;
  if (humeur === 'sans-cuisson') return recette.appliances.includes('sans-cuisson');
  return recette.tags.includes(humeur);
}

/** Tire `n` recettes au hasard, en évitant si possible celles déjà affichées. */
export function tirer(recettes, n, aEviter = [], hasard = Math.random) {
  const melanger = (liste) => {
    const copie = [...liste];
    for (let i = copie.length - 1; i > 0; i -= 1) {
      const j = Math.floor(hasard() * (i + 1));
      [copie[i], copie[j]] = [copie[j], copie[i]];
    }
    return copie;
  };
  const neuves = melanger(recettes.filter((r) => !aEviter.includes(r.id)));
  const vues = melanger(recettes.filter((r) => aEviter.includes(r.id)));
  return [...neuves, ...vues].slice(0, n);
}

/** Ingrédients manquants des recettes sauvegardées, additionnés par nom et unité. */
export function coursesAuto(recettes, dispo) {
  const total = new Map();
  for (const recette of recettes) {
    for (const i of analyser(recette, dispo).manquants) {
      const cle = `${normaliser(i.name)}|${i.unit}`;
      const ligne = total.get(cle) ?? { key: cle, name: i.name, unit: i.unit, category: i.category, quantity: 0 };
      ligne.quantity += i.quantity;
      total.set(cle, ligne);
    }
  }
  return [...total.values()];
}

// Unités qui prennent un « s » au pluriel
const UNITES_ACCORDEES = new Set(['tranche', 'feuille', 'pincée']);

export function formatQuantite(quantite, unite = '') {
  if (quantite === null || quantite === undefined) return '';
  const nombre = quantite.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  if (!unite || unite === 'pièce') return nombre;
  const pluriel = quantite >= 2 && UNITES_ACCORDEES.has(unite) ? 's' : '';
  return `${nombre} ${unite}${pluriel}`;
}
