(function(root){
 function allowedItem(item){
  const id=String(item.id||''),name=String(item.name||'');
  // Tree seeds are inventory products, unlike the world objects they grow into.
  if(/(?:^|_)SEED(?:_|$)/i.test(id)||/\bseeds?\b/i.test(name)||item.category==='CAT_MAIN_SEEDS')return true;
  return !/\b(?:deposits?|trees?)\b/i.test(name)&&!/(?:^|_)(?:DEPOSITS?|TREES?)(?:_|$)/i.test(id);
 }
 function allowedRecipe(recipe,blockedIds=new Set()){
  return [recipe.outputId,...recipe.ingredients.map(i=>i.itemId)].every(id=>!blockedIds.has(id)&&allowedItem({id,name:id.replace(/[_-]/g,' ')}));
 }
 root.SeedScope={allowedItem,allowedRecipe};if(typeof module!=='undefined')module.exports=root.SeedScope;
})(globalThis);
