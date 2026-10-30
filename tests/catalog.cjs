const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {resolveAll,build}=require('../scripts/build-catalog.cjs');
const api=require('../catalog-api.js');
const source=JSON.parse(fs.readFileSync('data/seed-static-data-source.json'));
const exported=JSON.parse(fs.readFileSync('data/seed-export.json'));
const c=build(source,exported);
assert.equal(c.items.length,2110);assert.equal(c.recipes.length,883);assert.equal(c.categories.length,53);
assert.deepEqual(c,(({source,...rest})=>rest)(JSON.parse(fs.readFileSync('data/catalog.json'))));
assert.equal(resolveAll({a:{Schematic:{Inputs:[1],Other:2}},b:{ParentIdentifier:'a',Schematic:{Inputs:[3]}}})[1].Schematic.Other,undefined);
assert.throws(()=>resolveAll({a:{ParentIdentifier:'b'},b:{ParentIdentifier:'a'}}),/cycle/);
for(const r of c.recipes){const old=exported.recipes.find(x=>x.id===r.id);assert.deepEqual(r.inputs,old.inputs.map(x=>({itemId:x.item_id,quantity:x.quantity})));assert.deepEqual(r.outputs,old.outputs.map(x=>({itemId:x.item_id,quantity:x.quantity,probability:x.probability_raw})));}
const juice=c.recipes.find(r=>r.outputs.some(x=>c.items.find(i=>i.id===x.itemId)?.name==='Berry Juice'));
assert(juice);assert.equal(juice.inputs.length,3);
assert.equal(api.calculatorRecipe({...juice,outputs:[{itemId:'x',quantity:1,probability:50}]}),null);
assert.equal(api.calculatorRecipe({...juice,featureFlag:'disabled'}),null);
// Exercise the actual calculator importer, preserving prices and rejecting atomic bad imports.
const code=fs.readFileSync('app.js','utf8');const context=vm.createContext({structuredClone,localStorage:{getItem:()=>null,setItem:()=>{}},document:{getElementById:()=>({value:''})}});
vm.runInContext(code.slice(0,code.indexOf("document.querySelectorAll('[data-tab]')"))+code.slice(code.indexOf('function mergeCatalog'),code.indexOf("$('catalogImport').onchange"))+';save=()=>{};',context);
const suitable=c.recipes.find(r=>api.calculatorRecipe(r));context.payload=api.importPayload(c,suitable);
vm.runInContext('mergeCatalog(payload); db.items[0].ask=42; mergeCatalog(payload);',context);
assert.equal(vm.runInContext('db.items[0].ask',context),42);
const before=vm.runInContext('JSON.stringify(db)',context);context.bad={items:[],recipes:[{outputId:'missing',yield:1,ingredients:[]}]};assert.throws(()=>vm.runInContext('mergeCatalog(bad)',context));assert.equal(vm.runInContext('JSON.stringify(db)',context),before);
console.log('PASS: full source/export parity, inheritance, counts, Berry Juice, probability gates, real importer preservation and atomic rejection');
