(function(root){
 function create(items,recipes){
  const itemMap=new Map(items.map(i=>[i.id,i])),byOutput=new Map(),reverse=new Map();
  for(const r of recipes){if(!byOutput.has(r.outputId))byOutput.set(r.outputId,[]);byOutput.get(r.outputId).push(r);for(const i of r.ingredients){if(!reverse.has(i.itemId))reverse.set(i.itemId,new Set());reverse.get(i.itemId).add(r.outputId)}}
  function plan(id,quantity,mode='best',stack=[],budget={left:20000}){
   if(--budget.left<0)throw Error('Calculation too complex; add a purchase price for intermediate items.');
   const item=itemMap.get(id);if(!item)throw Error('Unknown item: '+id);
   const buy=Number.isFinite(item.ask)&&item.ask>=0?{cost:item.ask*quantity,method:'Buy',batches:0}:null;
   if(mode==='buy'){if(!buy)throw Error('Purchase price missing: '+item.name);return buy}
   if(stack.includes(id)){if(mode==='best'&&buy)return buy;throw Error('Recipe cycle: '+item.name)}
   let craft=null,failures=[];
   for(const r of byOutput.get(id)||[]){
    try{const batches=Math.ceil((quantity-1e-10)/r.yield),parts=r.ingredients.map(i=>plan(i.itemId,batches*i.quantity,'best',[...stack,id],budget));const candidate={cost:parts.reduce((s,p)=>s+p.cost,0),method:'Craft',batches,parts,recipeId:r.id||null,produced:batches*r.yield};if(!craft||candidate.cost<craft.cost)craft=candidate}
    catch(e){failures.push(e.message)}
   }
   if(mode==='craft'){if(craft)return craft;throw Error(failures[0]||'No recipe: '+item.name)}
   if(buy&&(!craft||buy.cost<=craft.cost))return buy;
   if(craft)return craft;
   throw Error(failures[0]||'Purchase price or recipe missing: '+item.name);
  }
  function affected(id){const found=new Set(),queue=[id];for(let n=0;n<queue.length;n++)for(const output of reverse.get(queue[n])||[]){if(output===id||found.has(output))continue;found.add(output);queue.push(output)}return [...found]}
  return {plan,affected};
 }
 root.SeedPlanner={create};if(typeof module!=='undefined')module.exports=root.SeedPlanner;
})(globalThis);
