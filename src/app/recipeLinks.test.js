import { describe, it, expect } from 'vitest';
import { recipeChoices, recipeIngredient } from './recipeLinks.js';
import { RecipeEdit } from './editState.svelte.js';
import { buildList } from './shoppingList.js';
const parent={id:1,_id:'pie',title:'Pie'};
const dough={id:2,_id:'dough',title:'Dough',categories:[{name:'Pastry'}],ingredients:[{text:'flour',amount:{amount:2,unit:'kg'}}]};
describe('recipe ingredient selection',()=>{
 it('searches names/categories and excludes self, deleted recipes and shopping lists',()=>{
  const recipes=[parent,dough,{id:3,title:'Deleted',deleted:1},{id:4,title:'Shopping',isShoppingList:1}];
  expect(recipeChoices(recipes,parent)).toEqual([dough]);
  expect(recipeChoices(recipes,parent,'pastry dough')).toEqual([dough]);
  expect(recipeChoices(recipes,parent,'soup')).toEqual([]);
 });
 it('uses the exact remote ID with batch semantics and retains local-only references',()=>{
  expect(recipeIngredient(dough,0.5)).toEqual({text:'Dough',reference:'dough',amount:{amount:0.5,unit:'recipe'}});
  expect(recipeIngredient({id:7,title:'Unsynced dough'}).reference).toBe(7);
  expect(()=>recipeIngredient(dough,0)).toThrow(/positive/);
 });
 it('stores a linked ingredient in the draft and expands its batch amount for shopping',async()=>{
  let saved;
  const edit=new RecipeEdit({...parent,ingredients:[]},{data:{updateRecipe:async r=>(saved=r)}});
  edit.list('ingredients').push(recipeIngredient(dough,0.5));
  expect(parent.ingredients).toBeUndefined();
  await edit.save();
  const items=buildList({ingredients:[{reference:'pie'}]},[saved,dough]).items;
  expect(items[0].amounts[0]).toMatchObject({amount:1,unit:'kg'});
  expect(saved.ingredients[0].reference).toBe('dough');
 });
});
