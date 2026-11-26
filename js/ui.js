// Fonctions DOM : création d'éléments, cartes et messages.

/** Crée un élément ; le texte est toujours inséré sans interprétation HTML. */
export function el(balise, attributs = {}, ...enfants) {
  const noeud = document.createElement(balise);
  for (const [nom, valeur] of Object.entries(attributs)) {
    if (valeur === false || valeur === null || valeur === undefined) continue;
    if (nom.startsWith('on')) noeud.addEventListener(nom.slice(2), valeur);
    else noeud.setAttribute(nom, valeur === true ? '' : valeur);
  }
  noeud.append(...enfants.flat().filter((e) => e !== null && e !== false && e !== undefined));
  return noeud;
}

export function formatDuree(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const reste = minutes % 60;
  return `${Math.floor(minutes / 60)} h${reste ? ` ${String(reste).padStart(2, '0')}` : ''}`;
}

/** Bouton à bascule (filtres et suggestions). */
export function pastille(texte, active, action, cle) {
  return el('button', { type: 'button', class: 'pastille', 'aria-pressed': String(active), 'data-focus': cle, onclick: action }, texte);
}

export function boutonFavori(actif, nom, action, cle) {
  return el('button', {
    type: 'button',
    class: 'favori',
    // Pas d'aria-pressed : le libellé change déjà selon l'état
    'aria-label': `${actif ? 'Retirer des favoris' : 'Ajouter aux favoris'} : ${nom}`,
    'data-focus': cle,
    onclick: action,
  }, actif ? '♥' : '♡');
}

/** Carte de recette ; `pourcentage` est la part d'ingrédients possédés. */
export function carteRecette(recette, { pourcentage, duree, favori }) {
  return el('li', { class: 'carte' },
    el('a', { class: 'carte-lien', href: `#/recette/${recette.id}` },
      el('span', { class: 'carte-emoji', 'aria-hidden': 'true' }, recette.emoji),
      el('span', { class: 'carte-titre' }, recette.name),
      el('span', { class: 'discret' }, recette.description),
      el('span', { class: 'discret' }, `${formatDuree(duree)} · ≈ ${recette.calories} kcal · ${recette.difficulty}`),
      el('span', { class: pourcentage === 100 ? 'match complet' : 'match' }, `${pourcentage} % des ingrédients`),
      el('progress', { max: 100, value: pourcentage, 'aria-hidden': 'true' })),
    favori);
}

export const grille = (cartes) => el('ul', { class: 'grille' }, cartes);

/** Message d'état vide, avec une action facultative pour en sortir. */
export const etatVide = (message, action) => (action
  ? el('div', { class: 'vide' }, el('p', {}, message), action)
  : el('p', { class: 'vide' }, message));

/** Annonce discrète aux lecteurs d'écran (zone permanente, invisible). */
export function annoncer(message) {
  const zone = document.getElementById('annonce');
  if (zone) zone.textContent = message;
}

let minuterie;

/** Message temporaire annoncé aux lecteurs d'écran. */
export function toast(message) {
  const zone = document.getElementById('toast');
  zone.textContent = message;
  zone.classList.add('visible');
  clearTimeout(minuterie);
  // Durée proportionnelle à la longueur pour laisser le temps de lire
  minuterie = setTimeout(() => zone.classList.remove('visible'), Math.max(3000, message.length * 90));
}
