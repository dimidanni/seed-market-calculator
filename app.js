'use strict';
const $=id=>document.getElementById(id), money=n=>Number.isFinite(n)?n.toLocaleString('nl-BE',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';
const starter={updatedAt:null,source:'manual',items:[],recipes:[]};
let db=load();
function validate(d){if(!d||!Array.isArray(d.items)||!Array.isArray(d.recipes))throw Error('Ongeldig JSON-formaat');const ids=new Set();for(const i of d.items){if(typeof i.id!=='string'||!i.id||typeof i.name!=='string'||ids.has(i.id)||(i.ask!==null&&(!Number.isFinite(i.ask)||i.ask<0))||(i.bid!==null&&(!Number.isFinite(i.bid)||i.bid<0)))throw Error('Ongeldig of dubbel item');ids.add(i.id)}for(const r of d.recipes){if(!ids.has(r.outputId)||!Number.isFinite(r.yield)||r.yield<=0||!Array.isArray(r.ingredients)||!r.ingredients.length)throw Error('Ongeldig recept');for(const ing of r.ingredients)if(!ids.has(ing.itemId)||!Number.isFinite(ing.quantity)||ing.quantity<=0)throw Error('Ongeldig ingrediënt')}return d}
function load(){try{return validate(JSON.parse(localStorage.getItem('seed-market-v1')))||structuredClone(starter)}catch{return structuredClone(starter)}}
function save(){localStorage.setItem('seed-market-v1',JSON.stringify(db));render()}
const get=id=>db.items.find(x=>x.id===id), recipe=id=>db.recipes.find(x=>x.outputId===id);
function options(selected){return db.items.map(i=>`<option value="${escapeHTML(i.id)}" ${i.id===selected?'selected':''}>${escapeHTML(i.name)}</option>`).join('')}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function plan(id,quantity,mode='best',stack=[]){
 if(stack.includes(id))throw Error('Cyclisch recept: '+[...stack,id].join(' → '));
 const item=get(id);if(!item)throw Error('Onbekend item: '+id);
 const buy=Number.isFinite(item.ask)&&item.ask>=0?{cost:item.ask*quantity,method:'Kopen',batches:0}:null;
 const r=recipe(id);let craft=null;
 if(r){
  const batches=Math.ceil((quantity-1e-10)/r.yield);
  let sum=0;const parts=[];
  for(const ing of r.ingredients){const sub=plan(ing.itemId,batches*ing.quantity,'best',[...stack,id]);sum+=sub.cost;parts.push(sub)}
  craft={cost:sum,method:'Craften',batches,parts};
 }
 if(mode==='buy'){if(!buy)throw Error('Koopprijs ontbreekt voor '+item.name);return buy}
 if(mode==='craft'){if(!craft)throw Error('Geen recept voor '+item.name);return craft}
 if(buy&&craft)return buy.cost<=craft.cost?buy:craft;
 if(buy||craft)return buy||craft;
 throw Error('Geen koopprijs of recept voor '+item.name);
}
function num(id){const n=Number($(id).value);return Number.isFinite(n)?n:NaN}
function calculate(){
 const id=$('product').value,i=get(id),q=num('quantity'),labor=num('labor'),fixed=num('fixed'),tax=num('tax'),transport=num('transport');
 if(!i){$('result').innerHTML='<p class="muted">Voeg eerst items en recepten toe.</p>';return}
 if(![q,labor,fixed,tax,transport].every(Number.isFinite)||q<=0||!Number.isInteger(q)||labor<0||fixed<0||transport<0||tax<0||tax>100){$('result').textContent='Gebruik een positief geheel aantal en geldige kosten.';return}
 try{
  const mode=$('strategy').value,chosen=plan(id,q,mode),buy=(()=>{try{return plan(id,q,'buy')}catch{return null}})(),craft=(()=>{try{return plan(id,q,'craft')}catch{return null}})();
  if(!Number.isFinite(i.bid)||i.bid<0)throw Error('Verkoopprijs ontbreekt voor '+i.name);
  const materials=chosen.cost,work=labor*q,revenue=i.bid*q,fees=revenue*tax/100,total=materials+work+fixed+transport+fees,profit=revenue-total,margin=revenue?profit/revenue*100:0;
  const stats=[['Gekozen methode',chosen.method],['Benodigde batches',chosen.method==='Craften'?chosen.batches:'—'],['Materiaalkosten',money(materials)],['Totale kosten',money(total)],['Verkoopopbrengst',money(revenue)],['Nettowinst',money(profit)],['Winstmarge',money(margin)+'%'],['Marktinkoop',buy?money(buy.cost):'Onbekend'],['Zelf craften',craft?money(craft.cost):'Geen recept']];
  $('result').innerHTML='<div class="grid">'+stats.map(([k,v])=>'<div class="stat"><small>'+k+'</small><strong class="'+(k==='Nettowinst'?(profit>=0?'good':'bad'):'')+'">'+v+'</strong></div>').join('')+'</div><p class="muted">Volledige batches, inclusief eventuele overproductie. Tussenproducten worden per benodigde hoeveelheid geoptimaliseerd. Prijzen zijn handmatig en niet gegarandeerd.</p>';
 }catch(e){$('result').textContent=e.message}
}
function render(){const p=$('product').value, rp=$('recipeProduct').value;$('product').innerHTML=options(p);$('recipeProduct').innerHTML=options(rp);$('itemRows').innerHTML=db.items.map(i=>`<tr><td>${escapeHTML(i.name)}</td><td><input type="number" min="0" step="any" data-price="ask" data-id="${escapeHTML(i.id)}" value="${i.ask??''}"></td><td><input type="number" min="0" step="any" data-price="bid" data-id="${escapeHTML(i.id)}" value="${i.bid??''}"></td><td><button data-delete="${escapeHTML(i.id)}">Wissen</button></td></tr>`).join('');$('recipeList').innerHTML=db.recipes.map(r=>`<p>${escapeHTML(get(r.outputId)?.name||r.outputId)}: ${r.yield} ← ${r.ingredients.map(x=>`${x.quantity} × ${escapeHTML(get(x.itemId)?.name||x.itemId)}`).join(', ')} <button data-edit="${escapeHTML(r.outputId)}">Bewerken</button> <button data-remove-recipe="${escapeHTML(r.outputId)}">Wissen</button></p>`).join('')||'<p class="muted">Nog geen recepten.</p>';$('updated').textContent=db.updatedAt?`${db.updatedAt} (${db.source||'onbekend'})`:'Nog niet opgehaald';calculate()}
function addIngredient(id='',quantity=1){const div=document.createElement('div');div.className='row';div.style.marginTop='10px';div.innerHTML=`<select class="ingredient">${options(id)}</select><input class="amount" aria-label="Hoeveelheid" type="number" min="0.001" step="any" value="${quantity}"><button type="button" class="removeIngredient">✕</button>`;div.querySelector('button').onclick=()=>div.remove();$('ingredientRows').append(div)}
function selectRecipe(id){const r=recipe(id);$('recipeProduct').value=id;$('yield').value=r?.yield||1;$('ingredientRows').innerHTML='';(r?.ingredients||[{itemId:db.items[0]?.id,quantity:1}]).forEach(x=>addIngredient(x.itemId,x.quantity))}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));['calc','items','recipes','data'].forEach(t=>$(t).classList.toggle('hidden',t!==b.dataset.tab))});
['product','quantity','labor','fixed','tax','transport','strategy'].forEach(id=>$(id).addEventListener('input',calculate));
$('addItem').onclick=()=>{const name=$('itemName').value.trim(),ask=$('ask').value.trim()===''?null:num('ask'),bid=$('bid').value.trim()===''?null:num('bid');if(!name||![ask,bid].every(x=>x===null||(Number.isFinite(x)&&x>=0)))return alert('Vul een naam en geldige prijzen in.');let id=name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'item';let base=id,n=2;while(get(id))id=base+'-'+n++;db.items.push({id,name,ask,bid});$('itemName').value='';save()};
$('itemRows').onchange=e=>{const id=e.target.dataset.id,k=e.target.dataset.price;if(!id||!k)return;const v=e.target.value.trim()===''?null:Number(e.target.value);if(v!==null&&(!Number.isFinite(v)||v<0)){render();return alert('Prijs moet 0 of hoger zijn')}get(id)[k]=v;save()};
$('itemRows').onclick=e=>{const id=e.target.dataset.delete;if(!id)return;if(!confirm('Item en alle recepten die dit gebruiken verwijderen?'))return;db.items=db.items.filter(x=>x.id!==id);db.recipes=db.recipes.filter(r=>r.outputId!==id&&!r.ingredients.some(x=>x.itemId===id));save()};
$('addIngredient').onclick=()=>addIngredient();$('saveRecipe').onclick=()=>{const outputId=$('recipeProduct').value,yieldValue=num('yield'),ingredients=[...$('ingredientRows').children].map(r=>({itemId:r.querySelector('select').value,quantity:Number(r.querySelector('input').value)}));if(!outputId||!Number.isFinite(yieldValue)||yieldValue<=0||!ingredients.length||ingredients.some(x=>!x.itemId||!Number.isFinite(x.quantity)||x.quantity<=0))return alert('Controleer het recept.');const previous=db.recipes;db.recipes=[...previous.filter(x=>x.outputId!==outputId),{outputId,yield:yieldValue,ingredients}];try{cost(outputId)}catch(e){db.recipes=previous;return alert(e.message)}save();alert('Recept opgeslagen')};
$('recipeList').onclick=e=>{const edit=e.target.dataset.edit,del=e.target.dataset.removeRecipe;if(edit)selectRecipe(edit);if(del){db.recipes=db.recipes.filter(r=>r.outputId!==del);save()}};
$('export').onclick=()=>{const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='seed-market-data.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$('import').onchange=async e=>{try{const d=validate(JSON.parse(await e.target.files[0].text()));db=d;save();alert('Gegevens geïmporteerd')}catch(err){alert('Import mislukt: '+err.message)}e.target.value=''};
$('reset').onclick=()=>{if(confirm('Alle lokale items en recepten wissen?')){db=structuredClone(starter);save()}};
$('fetch').onclick=async()=>{try{const url=$('sourceUrl').value.trim(),u=new URL(url);if(u.protocol!=='https:')throw Error('Gebruik een HTTPS URL');const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw Error('HTTP '+response.status);const incoming=JSON.parse(await response.text());if(!Array.isArray(incoming.items))throw Error('items ontbreekt');const merged=structuredClone(db);for(const i of incoming.items){if(typeof i.id!=='string'||typeof i.name!=='string'||(i.ask!==null&&(!Number.isFinite(i.ask)||i.ask<0))||(i.bid!==null&&(!Number.isFinite(i.bid)||i.bid<0)))throw Error('Ongeldige externe prijs');const existing=merged.items.find(x=>x.id===i.id);if(existing){existing.ask=i.ask;existing.bid=i.bid}else merged.items.push({id:i.id,name:i.name,ask:i.ask,bid:i.bid})}merged.updatedAt=incoming.updatedAt||new Date().toISOString();merged.source=incoming.source||url;validate(merged);db=merged;save();alert('Prijzen bijgewerkt')}catch(e){alert('Ophalen mislukt: '+e.message)}};
render();addIngredient();
