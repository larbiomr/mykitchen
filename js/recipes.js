// Base de recettes de MyKitchen.
// Les calories sont des estimations par portion ; les quantités valent pour `servings` portions.

/**
 * Construit une recette. Chaque ingrédient s'écrit « quantité|unité|nom|catégorie »,
 * la catégorie étant f (frigo), p (placard) ou e (épices).
 */
const CATEGORIE = { f: 'frigo', p: 'placard', e: 'epices' };

function r(id, name, emoji, description, time_prep, time_cook, calories, difficulty, appliances, meal_type, tags, ingredients, steps) {
  return {
    id, name, emoji, description, time_prep, time_cook, calories, difficulty,
    servings: 1, appliances, meal_type, tags, steps,
    ingredients: ingredients.map((ligne) => {
      const [q, unit, nom, cat] = ligne.split('|');
      return { name: nom, quantity: Number(q), unit, category: CATEGORIE[cat] };
    }),
  };
}

const SANS = ['sans-cuisson'];
const MO = ['micro-onde'];
const PLAQUES = ['plaques'];
const FOUR = ['four'];
const REPAS = ['dejeuner', 'diner'];

export const RECIPES = [
  // ----- Sans cuisson -----
  r('sandwich-crudites', 'Sandwich thon crudités', '🥪', 'Le déjeuner à emporter en cinq minutes.', 5, 0, 420, 'facile', SANS, ['dejeuner', 'snack'], ['healthy'],
    ['2|tranche|pain|p', '80|g|thon en boîte|p', '1|pièce|tomate|f', '2|feuille|salade verte|f', '1|c. à soupe|mayonnaise|f'],
    ['Égoutter le thon et le mélanger avec la mayonnaise.', 'Laver la salade et couper la tomate en rondelles.', 'Garnir le pain et refermer.']),
  r('salade-composee', 'Salade composée', '🥗', 'Fraîche, colorée et rassasiante.', 10, 0, 380, 'facile', SANS, REPAS, ['healthy'],
    ['80|g|salade verte|f', '1|pièce|tomate|f', '60|g|maïs en boîte|p', '50|g|fromage|f', '1|c. à soupe|huile d’olive|p', '1|c. à café|vinaigre|p'],
    ['Laver et essorer la salade.', 'Couper la tomate et le fromage en dés.', 'Réunir avec le maïs égoutté.', 'Assaisonner avec l’huile, le vinaigre, le sel et le poivre.']),
  r('bol-cereales', 'Bol de céréales à la banane', '🥣', 'Le classique des matins pressés.', 3, 0, 400, 'facile', SANS, ['petit-dej', 'snack'], [],
    ['60|g|céréales|p', '200|ml|lait|f', '1|pièce|banane|p'],
    ['Verser les céréales dans un bol.', 'Ajouter le lait.', 'Couper la banane en rondelles par-dessus.']),
  r('yaourt-miel', 'Yaourt, miel et fruits', '🍯', 'Un en-cas doux et léger.', 3, 0, 300, 'facile', SANS, ['petit-dej', 'snack'], ['healthy'],
    ['125|g|yaourt|f', '1|c. à soupe|miel|p', '1|pièce|banane|p', '20|g|flocons d’avoine|p'],
    ['Verser le yaourt dans un bol.', 'Ajouter la banane en morceaux et les flocons d’avoine.', 'Napper de miel.']),
  r('pain-pate-a-tartiner', 'Pain à la pâte à tartiner', '🍫', 'Le réconfort en deux minutes.', 2, 0, 330, 'facile', SANS, ['petit-dej', 'snack'], ['comfort'],
    ['2|tranche|pain|p', '30|g|pâte à tartiner|p'],
    ['Trancher le pain si nécessaire.', 'Étaler la pâte à tartiner et déguster.']),
  // ----- Micro-ondes -----
  r('riz-micro-onde', 'Riz au beurre au micro-ondes', '🍚', 'Du riz sans casserole.', 2, 13, 390, 'facile', MO, REPAS, ['comfort'],
    ['80|g|riz|p', '180|ml|eau|p', '10|g|beurre|f'],
    ['Rincer le riz et le placer dans un grand bol adapté au micro-ondes avec l’eau salée.', 'Couvrir sans fermer hermétiquement.', 'Cuire 12 à 13 minutes à 600 W, en surveillant le débordement.', 'Laisser reposer 3 minutes, puis ajouter le beurre.']),
  r('oeufs-brouilles-mo', 'Œufs brouillés au micro-ondes', '🍳', 'Moelleux et prêts en quelques minutes.', 2, 2, 270, 'facile', MO, ['petit-dej', 'diner'], ['healthy'],
    ['2|pièce|œuf|f', '2|c. à soupe|lait|f', '5|g|beurre|f'],
    ['Battre les œufs et le lait dans un grand bol avec le beurre.', 'Cuire 40 secondes à 800 W, puis remuer.', 'Poursuivre par tranches de 20 secondes jusqu’à ce que les œufs soient pris.']),
  r('mug-cake', 'Mug cake au chocolat', '🧁', 'Un gâteau chaud dans une tasse.', 4, 1, 520, 'facile', MO, ['snack'], ['comfort'],
    ['40|g|farine|p', '25|g|sucre|p', '1|c. à soupe|cacao|p', '1|pièce|œuf|f', '3|c. à soupe|lait|f', '15|g|beurre|f', '2|g|levure chimique|p'],
    ['Faire fondre le beurre dans une grande tasse.', 'Ajouter le sucre, l’œuf et le lait, puis mélanger.', 'Incorporer la farine, le cacao et la levure.', 'Cuire environ 1 minute 15 à 800 W, jusqu’à ce que le centre soit pris (une tasse par personne, cuite séparément).']),
  r('soupe-tomate-mo', 'Soupe de tomate express', '🍅', 'Une soupe chaude sans casserole.', 3, 5, 160, 'facile', MO, ['diner'], ['healthy'],
    ['200|g|tomate concassée|p', '150|ml|eau|p', '1|c. à café|huile d’olive|p', '1|c. à café|herbes de Provence|e', '20|g|fromage|f'],
    ['Mélanger les tomates, l’eau, l’huile et les herbes dans un grand bol.', 'Couvrir sans fermer hermétiquement et chauffer 4 à 5 minutes à 800 W en remuant à mi-temps.', 'Parsemer de fromage râpé.']),
  r('pates-micro-onde', 'Pâtes au fromage au micro-ondes', '🧀', 'Comme un mac and cheese, dans un bol.', 2, 12, 520, 'facile', MO, REPAS, ['comfort'],
    ['90|g|pâtes|p', '250|ml|eau|p', '50|ml|lait|f', '40|g|fromage|f'],
    ['Mettre les pâtes et l’eau salée dans un très grand bol.', 'Cuire 10 à 12 minutes à 800 W en remuant toutes les 4 minutes.', 'Ajouter le lait et le fromage râpé.', 'Remuer, chauffer 30 secondes et poivrer.']),
  // ----- Plaques -----
  r('pates-tomate', 'Pâtes à la sauce tomate', '🍝', 'La valeur sûre du soir.', 5, 12, 480, 'facile', PLAQUES, REPAS, ['comfort'],
    ['100|g|pâtes|p', '150|g|tomate concassée|p', '1|pièce|oignon|p', '1|c. à soupe|huile d’olive|p', '1|c. à café|herbes de Provence|e'],
    ['Porter une casserole d’eau salée à ébullition et cuire les pâtes.', 'Faire revenir l’oignon émincé dans l’huile.', 'Ajouter les tomates et les herbes, puis mijoter 8 minutes.', 'Égoutter les pâtes et les mélanger à la sauce.']),
  r('riz-saute', 'Riz sauté à l’œuf', '🍛', 'Un wok complet et économique.', 8, 20, 530, 'moyen', PLAQUES, REPAS, [],
    ['80|g|riz|p', '1|pièce|œuf|f', '1|pièce|carotte|f', '1|pièce|oignon|p', '2|c. à soupe|sauce soja|p', '1|c. à soupe|huile|p'],
    ['Cuire le riz, l’égoutter et l’étaler pour qu’il refroidisse un peu.', 'Faire sauter l’oignon et la carotte en petits dés dans l’huile.', 'Pousser les légumes sur le côté et brouiller l’œuf jusqu’à ce qu’il soit pris.', 'Ajouter le riz et la sauce soja, puis faire sauter 4 minutes.']),
  r('omelette-fromage', 'Omelette au fromage', '🍳', 'Prête en moins de dix minutes.', 3, 5, 390, 'facile', PLAQUES, ['dejeuner', 'diner'], ['healthy'],
    ['3|pièce|œuf|f', '30|g|fromage|f', '10|g|beurre|f'],
    ['Battre les œufs avec le sel et le poivre.', 'Faire fondre le beurre dans une poêle chaude.', 'Verser les œufs et cuire 3 minutes en ramenant les bords.', 'Ajouter le fromage, plier et poursuivre jusqu’à ce que les œufs soient pris.']),
  r('soupe-legumes', 'Soupe de légumes', '🍲', 'Réconfortante et pleine de légumes.', 10, 18, 220, 'facile', PLAQUES, ['diner'], ['healthy', 'comfort'],
    ['2|pièce|carotte|f', '1|pièce|pomme de terre|p', '1|pièce|oignon|p', '400|ml|eau|p', '1|pièce|bouillon cube|p'],
    ['Éplucher et couper les légumes en très petits dés.', 'Les placer dans une casserole avec l’eau et le bouillon.', 'Porter à ébullition, couvrir et cuire environ 15 minutes, jusqu’à ce que les légumes soient tendres.', 'Mixer ou écraser selon la texture souhaitée.']),
  r('nouilles-sautees', 'Nouilles sautées aux légumes', '🍜', 'Rapide comme au comptoir.', 6, 8, 450, 'facile', PLAQUES, REPAS, [],
    ['90|g|nouilles|p', '1|pièce|carotte|f', '1|pièce|oignon|p', '2|c. à soupe|sauce soja|p', '1|c. à soupe|huile|p'],
    ['Cuire les nouilles selon le paquet et les égoutter.', 'Émincer finement la carotte et l’oignon.', 'Les faire sauter 5 minutes dans l’huile.', 'Ajouter les nouilles et la sauce soja, puis mélanger 2 minutes.']),
  // ----- Four -----
  r('pizza-maison', 'Pizza maison', '🍕', 'Garnie comme tu l’aimes.', 10, 15, 820, 'facile', FOUR, REPAS, ['comfort'],
    ['200|g|pâte à pizza|f', '100|g|tomate concassée|p', '80|g|fromage|f', '1|c. à café|herbes de Provence|e'],
    ['Préchauffer le four à 230 °C.', 'Étaler la pâte sur une plaque.', 'Répartir les tomates, le fromage et les herbes.', 'Cuire 12 à 15 minutes jusqu’à ce que les bords soient dorés.']),
  r('gratin-pates', 'Gratin de pâtes', '🧀', 'Doré dessus, fondant dessous.', 10, 30, 700, 'facile', FOUR, REPAS, ['comfort'],
    ['90|g|pâtes|p', '80|ml|crème|f', '40|g|fromage|f', '60|g|jambon de dinde|f'],
    ['Préchauffer le four à 200 °C.', 'Cuire les pâtes à l’eau salée en les gardant fermes.', 'Les mélanger avec la crème et le jambon en morceaux dans un plat.', 'Couvrir de fromage et gratiner 20 minutes.']),
  r('croque-monsieur', 'Croque-monsieur', '🥪', 'Croustillant et filant.', 5, 12, 450, 'facile', FOUR, ['dejeuner', 'diner', 'snack'], ['comfort'],
    ['2|tranche|pain|p', '1|tranche|jambon de dinde|f', '40|g|fromage|f', '10|g|beurre|f'],
    ['Préchauffer le four à 200 °C.', 'Beurrer le pain, côté extérieur.', 'Garnir de jambon et de la moitié du fromage, puis refermer.', 'Parsemer du reste de fromage et cuire 10 à 12 minutes.']),
  r('nuggets-maison', 'Nuggets de poulet maison', '🍗', 'Croustillants sans friture.', 15, 18, 460, 'moyen', FOUR, REPAS, ['comfort'],
    ['150|g|blanc de poulet|f', '1|pièce|œuf|f', '30|g|farine|p', '40|g|chapelure|p', '1|c. à soupe|huile|p', '1|c. à café|paprika|e'],
    ['Préchauffer le four à 210 °C.', 'Couper le poulet en bouchées ; laver ensuite planche, couteau et mains.', 'Passer chaque morceau dans la farine au paprika, l’œuf battu puis la chapelure.', 'Disposer sur une plaque et arroser d’huile.', 'Cuire 18 minutes en retournant à mi-cuisson : le centre doit être bien cuit, sans trace rosée (74 °C).']),
  // En moules individuels : œufs entiers et cuisson identique quel que soit le nombre de portions
  r('cake-sale', 'Petits cakes salés jambon-olives', '🍞', 'Des cakes individuels à préparer à l’avance (3 par personne).', 10, 22, 510, 'moyen', FOUR, ['dejeuner', 'snack'], [],
    ['50|g|farine|p', '1|pièce|œuf|f', '30|ml|lait|f', '1|c. à soupe|huile|p', '30|g|jambon de dinde|f', '25|g|fromage|f', '15|g|olive|p', '3|g|levure chimique|p'],
    ['Préchauffer le four à 180 °C.', 'Mélanger la farine et la levure, puis ajouter l’œuf, le lait et l’huile.', 'Incorporer le jambon et les olives en petits morceaux, puis le fromage râpé.', 'Répartir dans des moules à muffins huilés (environ 3 par personne), remplis aux trois quarts.', 'Cuire 20 à 22 minutes, jusqu’à ce qu’une lame ressorte sèche.']),
  // ----- Petit-déjeuner -----
  r('porridge', 'Porridge à la banane', '🥣', 'Chaud et rassasiant.', 2, 3, 360, 'facile', MO, ['petit-dej'], ['healthy', 'comfort'],
    ['50|g|flocons d’avoine|p', '200|ml|lait|f', '1|pièce|banane|p', '1|c. à café|miel|p'],
    ['Mélanger les flocons et le lait dans un grand bol.', 'Cuire 2 à 3 minutes à 800 W en remuant à mi-temps.', 'Ajouter la banane et le miel.']),
  r('pancakes', 'Pancakes', '🥞', 'Le petit-déj du week-end.', 8, 10, 430, 'moyen', PLAQUES, ['petit-dej', 'snack'], ['comfort'],
    ['60|g|farine|p', '1|pièce|œuf|f', '90|ml|lait|f', '10|g|sucre|p', '3|g|levure chimique|p', '5|g|beurre|f'],
    ['Mélanger la farine, le sucre et la levure.', 'Ajouter l’œuf et le lait, puis fouetter.', 'Beurrer légèrement une poêle chaude.', 'Cuire de petites louches 2 minutes, retourner et cuire 1 minute.']),
  r('pain-perdu', 'Pain perdu', '🍞', 'La seconde vie du pain rassis.', 5, 6, 390, 'facile', PLAQUES, ['petit-dej', 'snack'], ['comfort'],
    ['2|tranche|pain|p', '1|pièce|œuf|f', '80|ml|lait|f', '10|g|sucre|p', '10|g|beurre|f'],
    ['Battre l’œuf avec le lait et le sucre.', 'Tremper les tranches de pain des deux côtés.', 'Les dorer au beurre 3 minutes par face.']),
  r('smoothie-banane', 'Smoothie banane-yaourt', '🥤', 'À boire en partant (mixeur nécessaire).', 4, 0, 260, 'facile', SANS, ['petit-dej', 'snack'], ['healthy'],
    ['1|pièce|banane|p', '125|g|yaourt|f', '100|ml|lait|f', '1|c. à café|miel|p'],
    ['Couper la banane en morceaux.', 'Mixer avec le yaourt, le lait et le miel.', 'Boire aussitôt.']),
  r('granola', 'Granola maison', '🌾', 'Croustillant, à garder dans un bocal.', 5, 25, 430, 'facile', FOUR, ['petit-dej', 'snack'], ['healthy'],
    ['50|g|flocons d’avoine|p', '15|g|amande|p', '1|c. à soupe|miel|p', '1|c. à soupe|huile|p', '1|pincée|cannelle|e'],
    ['Préchauffer le four à 160 °C.', 'Mélanger tous les ingrédients, les amandes grossièrement hachées.', 'Étaler sur une plaque.', 'Cuire 20 à 25 minutes en remuant à mi-cuisson.', 'Laisser refroidir : le granola durcit.']),
];
