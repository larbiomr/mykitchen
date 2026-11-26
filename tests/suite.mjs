// Tests de la logique et des pages (DOM factice) : node tests/suite.mjs
import assert from 'node:assert/strict';
const b=new URL('../js/',import.meta.url).href;
class N{constructor(t){this.tag=t;this.attrs={};this.kids=[];this.ev={};this.dataset={};this.value='';this.classList={add(){},remove(){}}}
 setAttribute(k,v){this.attrs[k]=String(v);if(k==='value')this.value=String(v)} getAttribute(k){return this.attrs[k]??null} removeAttribute(k){delete this.attrs[k]}
 addEventListener(e,f){this.ev[e]=f} append(...k){this.kids.push(...k)} replaceChildren(...k){this.kids=k} focus(){} querySelector(){return null} remove(){} select(){}
 get text(){return (this.textContent??'')+this.kids.map(k=>k instanceof N?k.text:String(k)).join(' ')}
 all(t){return this.kids.filter(k=>k instanceof N).flatMap(k=>[...(!t||k.tag===t?[k]:[]),...k.all(t)])}}
const ids={vue:new N('main'),toast:new N('div')},win={};let copie='';
const mem=new Map();globalThis.localStorage={getItem:k=>mem.get(k)??null,setItem:(k,v)=>mem.set(k,v)};
globalThis.document={createElement:t=>new N(t),getElementById:i=>ids[i],querySelectorAll:()=>[],addEventListener(){},body:new N('body')};
globalThis.location={hash:''};globalThis.window={addEventListener:(e,f)=>win[e]=f,scrollTo(){}};
Object.defineProperty(globalThis,'navigator',{value:{clipboard:{writeText:async t=>{copie=t}}},configurable:true});
const {RECIPES}=await import(b+'recipes.js'),m=await import(b+'matching.js'),s=await import(b+'storage.js');
// données
assert.equal(RECIPES.length,25);assert.equal(new Set(RECIPES.map(r=>r.id)).size,25);
for(const r of RECIPES){assert.ok(['facile','moyen'].includes(r.difficulty));for(const i of r.ingredients)assert.ok(i.name&&i.quantity>0&&i.category,r.id)}
for(const a of ['four','micro-onde','plaques','sans-cuisson'])assert.ok(m.filtrer(RECIPES,{appareil:a}).length>=5,a);
for(const d of [5,15,30])assert.ok(m.filtrer(RECIPES,{duree:d}).length);
assert.ok(RECIPES.filter(r=>r.meal_type.includes('petit-dej')).length>=5);
for(const h of ['rapide','comfort','healthy','sans-cuisson'])assert.ok(RECIPES.filter(r=>m.correspondHumeur(r,h)).length>=3,h);
// logique
assert.equal(m.normaliser('Œufs'),m.normaliser('œuf'));assert.equal(m.normaliser('pâtes'),m.normaliser('Spaghetti'));
assert.notEqual(m.normaliser('pâte à pizza'),m.normaliser('pâtes'));
assert.equal(m.disponibles([{name:'lait',expiry:'2026-01-01'}],'2026-11-25').size,0);
assert.equal(m.disponibles([{name:'lait',expiry:'2026-11-25'}],'2026-11-25').size,1);
const t=m.tirer(RECIPES,3);assert.equal(new Set(t.map(r=>r.id)).size,3);assert.ok(m.tirer(RECIPES,3,t.map(r=>r.id)).every(r=>!t.includes(r)));
// pages
const v=ids.vue,go=h=>{location.hash=h;win.hashchange()},btn=l=>v.all('button').find(x=>(x.attrs['aria-label']??'').startsWith(l)||x.text.includes(l));
await import(b+'app.js');
assert.match(v.text,/frigo est vide/);btn('+ pain').ev.click();btn('+ pâtes').ev.click();
const f=v.all('form')[0];f.all('input')[0].value='pâte à tartiner';f.all('select')[0].value='placard';f.all('input')[1].value='';f.ev.submit({preventDefault(){}});
assert.equal(s.getFridge().length,3);
s.addToFridge({name:'lait',category:'frigo',expiry:'2020-01-01'});go('#/frigo');assert.match(v.text,/Périmé depuis le 01\/01\/2020/);
go('#/cuisiner');assert.equal(v.all('li').length,25);btn('Je cuisine ça maintenant').ev.click();assert.equal(v.all('li').length,1);assert.match(v.text,/Pain à la pâte/);
btn('tout afficher').ev.click();btn('Four').ev.click();assert.equal(v.all('li').length,6);btn('Four').ev.click();assert.equal(v.all('li').length,25);
for(const r of RECIPES){go('#/recette/'+r.id);assert.ok(v.text.includes(r.name))}
go('#/recette/pancakes');btn('4 pers.').ev.click();assert.match(v.text,/240 g/);assert.ok(v.all('li').some(l=>l.attrs.class==='manquant'));
v.all('input')[0].ev.change({target:{checked:true}});btn('Ajouter aux favoris').ev.click();
go('#/courses');assert.match(v.text,/farine/);const g=v.all('form')[0];g.all('input')[0].value='savon';g.all('select')[0].value='placard';g.ev.submit({preventDefault(){}});
v.all('input').find(i=>i.attrs.type==='checkbox').ev.change();assert.equal(s.getChecked().length,1);
await btn('Copier en texte').ev.click();assert.match(copie,/- savon/);
btn('Supprimer savon').ev.click();assert.equal(s.getManualItems().length,0);
go('#/surprise');assert.equal(v.all('li').length,3);btn('Relancer').ev.click();btn('Healthy').ev.click();assert.equal(v.all('li').length,3);
go('#/favoris');assert.equal(v.all('li').length,1);btn('Retirer des favoris').ev.click();assert.match(v.text,/Touche/);
go('#/courses');assert.equal(s.getChecked().length,0);go('#/recette/x');assert.match(v.text,/existe pas/);
// stockage indisponible
delete globalThis.localStorage;assert.deepEqual(s.getFridge(),[]);assert.equal(s.addToFridge({name:'x',category:'frigo'}),false);for(const p of ['frigo','cuisiner','courses','surprise','favoris'])go('#/'+p);
console.log('tous les tests passent');process.exit(0);
