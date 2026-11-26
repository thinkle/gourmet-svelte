import { afterEach, beforeAll, afterAll, it, expect, vi } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import IngredientsEditor from '../screens/recipe/edit/IngredientsEditor.svelte';
import { RecipeEdit } from '../app/editState.svelte.js';
let component;
const showModal=HTMLDialogElement.prototype.showModal,close=HTMLDialogElement.prototype.close;
beforeAll(()=>{
 HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 HTMLDialogElement.prototype.close=function(){this.open=false;};
});
afterAll(()=>{HTMLDialogElement.prototype.showModal=showModal;HTMLDialogElement.prototype.close=close;});
afterEach(async()=>{if(component)await unmount(component);document.body.innerHTML='';});
const dough={id:2,_id:'remote-dough',title:'Dough',categories:[{name:'Pastry'}]};
function show(ingredients=[]) {
 const edit=new RecipeEdit({id:1,_id:'pie',title:'Pie',ingredients});
 component=mount(IngredientsEditor,{target:document.body,props:{edit,recipes:[dough,{id:1,_id:'pie',title:'Pie'}]}});flushSync();return edit;
}
function click(text){const button=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===text);expect(button).toBeTruthy();button.click();flushSync();}
function choose(){document.querySelector('.recipe-link-choices button').click();flushSync();click('Add linked recipe');}
it('adds a selected recipe with its reference rather than a plain ingredient string',()=>{
 const edit=show();click('Add recipe ingredient');
 expect(document.querySelector('.recipe-link-choices').textContent).not.toContain('Pie');
 choose();expect(edit.draft.ingredients[0].reference).toBe('remote-dough');
 expect(document.body.textContent).toContain('Linked recipe: Dough');
 click('Unlink');expect(edit.draft.ingredients[0].reference).toBeUndefined();expect(edit.draft.ingredients[0].text).toBe('Dough');
});
it('adds recipe links inside a group and Cancel leaves the draft unchanged',()=>{
 const edit=show([{text:'Filling',ingredients:[]}]);click('Add recipe to Filling');click('Cancel');expect(edit.dirty).toBe(false);
 click('Add recipe to Filling');choose();expect(edit.draft.ingredients[0].ingredients[0].reference).toBe('remote-dough');
 edit.revert();flushSync();expect(edit.dirty).toBe(false);
});
it('changes the target and allows a custom linked label without dropping the reference',()=>{
 const edit=show([{text:'Old dough',reference:'missing',shopItem:'old dough',ingkey:'old dough',amount:{amount:0.5,unit:'recipe'}}]);
 click('Change recipe');choose();
 expect(edit.draft.ingredients[0]).toMatchObject({reference:'remote-dough',amount:{amount:0.5}});
 expect(edit.draft.ingredients[0].shopItem).toBeUndefined();expect(edit.draft.ingredients[0].ingkey).toBeUndefined();
 const input=document.querySelector('input[aria-label="Linked recipe label"]');input.value='Half the crust';input.dispatchEvent(new Event('input',{bubbles:true}));flushSync();
 expect(edit.draft.ingredients[0]).toMatchObject({text:'Half the crust',reference:'remote-dough'});
 edit.draft.ingredients[0].shopItem='dough';edit.draft.ingredients[0].ingkey='dough';flushSync();
 click('Unlink');expect(edit.draft.ingredients[0].shopItem).toBeUndefined();expect(edit.draft.ingredients[0].ingkey).toBeUndefined();
});
