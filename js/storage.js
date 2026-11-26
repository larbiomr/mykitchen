// Accès au localStorage : aucune fonction ne lève d'exception.
// Les fonctions d'écriture renvoient false si rien n'a pu être enregistré.
const CLES = {
  frigo: 'mykitchen:frigo',
  favoris: 'mykitchen:favoris',
  manuel: 'mykitchen:courses-manuel',
  coches: 'mykitchen:courses-coches',
};
const CATEGORIES =['frigo', 'placard', 'epices'];

/** Lit un tableau JSON ; renvoie un tableau vide en cas de problème. */
function lire(cle) {
  try {
    const valeur = JSON.parse(globalThis.localStorage.getItem(cle));
    return Array.isArray(valeur) ? valeur : [];
  } catch {
    return [];
  }
}

function ecrire(cle, valeur) {
  try {
    globalThis.localStorage.setItem(cle, JSON.stringify(valeur));
    return true;
  } catch {
    return false;
  }
}

const identifiant = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// Date de péremption attendue au format AAAA-MM-JJ, sinon elle est effacée
const dateValide = (v) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '');

// Les entrées abîmées sont ignorées, les catégories et dates invalides sont corrigées
const articles = (cle) => lire(cle)
  .filter((a) => a && typeof a.id === 'string' && typeof a.name === 'string')
  .map((a) => ({
    ...a,
    category: CATEGORIES.includes(a.category) ? a.category : 'placard',
    ...('expiry' in a && { expiry: dateValide(a.expiry) }),
  }));

const textes = (cle) => lire(cle).filter((v) => typeof v === 'string');

// ----- Mon frigo -----
export const getFridge = () => articles(CLES.frigo);

/** Ajoute un ingrédient ; s'il existe déjà, met à jour sa catégorie et sa date. */
export function addToFridge({ name, category, expiry = '' }) {
  const nom = name.trim();
  if (!nom) return false;
  const liste = getFridge();
  const existant = liste.find((a) => a.name.toLowerCase() === nom.toLowerCase());
  if (existant) Object.assign(existant, { category, expiry });
  else liste.push({ id: identifiant(), name: nom, category, expiry });
  return ecrire(CLES.frigo, liste);
}

export const removeFromFridge = (id) => ecrire(CLES.frigo, getFridge().filter((a) => a.id !== id));

// ----- Favoris -----
export const getFavorites = () => textes(CLES.favoris);

export function toggleFavorite(id) {
  const favoris = getFavorites();
  const present = favoris.includes(id);
  const saved = ecrire(CLES.favoris, present ? favoris.filter((f) => f !== id) : [...favoris, id]);
  return { favorite: saved ? !present : present, saved };
}

// ----- Liste de courses -----
export const getManualItems = () => articles(CLES.manuel);

export function addManualItem({ name, category }) {
  const nom = name.trim();
  if (!nom) return false;
  return ecrire(CLES.manuel, [...getManualItems(), { id: identifiant(), name: nom, category }]);
}

export function removeManualItem(id) {
  const ok = ecrire(CLES.manuel, getManualItems().filter((a) => a.id !== id));
  if (ok) ecrire(CLES.coches, getChecked().filter((c) => c !== id));
  return ok;
}

export const getChecked = () => textes(CLES.coches);

export function toggleChecked(cle) {
  const coches = getChecked();
  return ecrire(CLES.coches, coches.includes(cle) ? coches.filter((c) => c !== cle) : [...coches, cle]);
}

/** Oublie les coches des articles disparus, pour qu'ils reviennent décochés. */
export function pruneChecked(clesPresentes) {
  const coches = getChecked();
  const gardees = coches.filter((c) => clesPresentes.includes(c));
  return gardees.length === coches.length || ecrire(CLES.coches, gardees);
}
