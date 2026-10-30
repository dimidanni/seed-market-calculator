const fs=require('node:fs'),crypto=require('node:crypto');
function resolveAll(defs){
 const cache=new Map();
 function resolve(id,stack=[]){
  if(cache.has(id))return cache.get(id);
  if(stack.includes(id))throw Error('Inheritance cycle: '+id);
  const own=defs[id];if(!own)throw Error('Missing parent: '+id);
  const parent=own.ParentIdentifier;
  const inherited=parent&&defs[parent]?resolve(parent,[...stack,id]):{};
  const result={...inherited,...own};cache.set(id,result);return result;
 }
 return Object.keys(defs).map(id=>({id,...resolve(id)}));
}
function build(source,exported){
 const categories=resolveAll(source.categories).map(x=>({id:x.id,...x.CategoryInfo}));
 const items=resolveAll(source.item_definitions).map(x=>({id:x.id,name:x.Info?.Name||x.id,description:x.Info?.Description||'',category:x.GameCategory?.Category||'',abstract:(x.Tags||[]).includes('ABSTRACT'),test:(x.Tags||[]).some(t=>/TEST/.test(t)),tags:x.GameTags?.Tags||[]}));
 const byId=new Map(items.map(x=>[x.id,x]));
 const recipes=resolveAll(source.schematics).map(x=>{
  const s=x.Schematic||{},meta=exported.recipes.find(r=>r.id===x.id);
  return {id:x.id,abstract:meta?.is_abstract||false,test:meta?.is_test||false,featureFlag:s.FeatureFlag||'',inputs:(s.Inputs||[]).map(i=>({itemId:i.Resource,quantity:i.Amount})),outputs:(s.Outputs?.OutputList||[]).map(i=>({itemId:i.Resource,quantity:i.Amount,probability:i.Probability})),independentRoll:s.Outputs?.IndependentRoll,times:s.Process?.CraftingTime||{},machines:s.Machines?.CraftedBy||[],machineItems:meta?.machine_item_ids||[],skill:x.SchematicProductionSkillRequirement||null,boosts:s.Process?.SpecialistBoosts||[],variations:s.Variations||{},activity:x.SchematicActivityOutcomes||null};
 });
 for(const r of recipes)for(const x of [...r.inputs,...r.outputs]){
  if(typeof x.itemId!=='string'||!Number.isFinite(x.quantity)||x.quantity<0)throw Error('Invalid resource in '+r.id);
  if(!byId.has(x.itemId)){const item={id:x.itemId,name:x.itemId,description:'Referenced resource; definition unavailable.',category:'',unresolved:true,tags:[]};items.push(item);byId.set(item.id,item);}
 }
 return {schemaVersion:1,items,categories,recipes};
}
if(require.main===module){
 const raw=fs.readFileSync('data/seed-static-data-source.json');
 const catalog=build(JSON.parse(raw),JSON.parse(fs.readFileSync('data/seed-export.json')));
 catalog.source={sha256:crypto.createHash('sha256').update(raw).digest('hex'),lines:raw.toString().split(/\r?\n/).length,build:JSON.parse(fs.readFileSync('data/seed-export.json')).client_build};
 fs.writeFileSync('data/catalog.json',JSON.stringify(catalog));console.log(JSON.stringify({items:catalog.items.length,recipes:catalog.recipes.length,categories:catalog.categories.length,source:catalog.source},null,2));
}
module.exports={build,resolveAll};
