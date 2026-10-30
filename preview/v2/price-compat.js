(function(root){
 const normalize=name=>String(name||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
 function overlay(catalog,local){
  const byName=new Map(),localById=new Map(local.map(i=>[i.id,i])),catalogIds=new Set(catalog.map(i=>i.id)),legacyByName=new Map();
  for(const i of local)if(!catalogIds.has(i.id)){const n=normalize(i.name);if(!legacyByName.has(n))legacyByName.set(n,[]);legacyByName.get(n).push(i)}
  for(const i of catalog){const name=normalize(i.name);if(!byName.has(name))byName.set(name,[]);byName.get(name).push(i)}
  const result=new Map(catalog.map(i=>[i.id,i]));
  for(const i of local)result.set(i.id,i);
  for(const [name,matches] of byName){
   if(matches.length!==1)continue;
   const canonical=matches[0],legacy=legacyByName.get(name)||[];
   if(legacy.length!==1)continue;
   const saved=localById.get(canonical.id),merged={...canonical,...saved};
   for(const field of ['ask','median','max','bid'])if(merged[field]==null&&Number.isFinite(legacy[0][field])&&legacy[0][field]>=0)merged[field]=legacy[0][field];
   result.set(canonical.id,merged);
  }
  return [...result.values()];
 }
 function uniqueChoices(items){const chosen=new Map();const score=i=>(Number.isFinite(i.ask)?100:0)+(!i.abstract?20:0)+(!i.test?10:0)+(i.id.startsWith('GMT_')?1:0);for(const i of items){const n=normalize(i.name),prev=chosen.get(n);if(!prev||score(i)>score(prev))chosen.set(n,i)}return [...chosen.values()]}
 root.SeedPrices={overlay,uniqueChoices};if(typeof module!=='undefined')module.exports=root.SeedPrices;
})(globalThis);
