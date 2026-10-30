(function(root){
 function calculatorRecipe(r){
  if(r.abstract||r.test||r.featureFlag||r.outputs.length!==1||r.outputs[0].probability!==100||!r.inputs.length||r.inputs.some(i=>i.quantity<=0)||r.outputs[0].quantity<=0||(r.boosts||[]).length||Object.values(r.variations||{}).some(x=>Array.isArray(x)&&x.length))return null;
  return {id:r.id,outputId:r.outputs[0].itemId,yield:r.outputs[0].quantity,ingredients:r.inputs};
 }
 function importPayload(c,r){const recipe=calculatorRecipe(r);if(!recipe)throw Error('Recipe requires unsupported output or variation semantics');const ids=new Set([recipe.outputId,...recipe.ingredients.map(x=>x.itemId)]);return {items:c.items.filter(i=>ids.has(i.id)),recipes:[recipe]};}
 root.SeedCatalog={calculatorRecipe,importPayload};
 if(typeof module!=='undefined')module.exports=root.SeedCatalog;
})(globalThis);
