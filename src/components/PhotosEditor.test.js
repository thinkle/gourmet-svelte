import { afterEach, describe, it, expect, vi } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import PhotosEditor from '../screens/recipe/edit/PhotosEditor.svelte';
import { RecipeEdit } from '../app/editState.svelte.js';
import { preparePhoto, photoFromUrl } from '../app/recipePhotos.js';
vi.mock('../app/recipePhotos.js',()=>({preparePhoto:vi.fn(),photoFromUrl:vi.fn(),photosFit:()=>true}));
let component;
afterEach(async()=>{if(component) await unmount(component);document.body.innerHTML='';vi.resetAllMocks();});
function show(images=[]) {
  const data={updateRecipe:vi.fn(async r=>r)};
  const edit=new RecipeEdit({id:1,title:'Pie',images},{data});
  component=mount(PhotosEditor,{target:document.body,props:{edit}});flushSync();return {edit,data};
}
const wait=async()=>{await Promise.resolve();await Promise.resolve();flushSync();};
describe('photo editor draft behavior',()=>{
  it('does not change photos on mount; removal and captions revert cleanly',()=>{
    const images=[{url:'data:image/png;base64,YQ==',caption:'Old',width:600}];
    const {edit}=show(images);expect(edit.dirty).toBe(false);
    const input=document.querySelector('input[aria-label="Caption for photo 1"]');
    input.value='New';input.dispatchEvent(new Event('input',{bubbles:true}));flushSync();
    expect(edit.draft.images[0].width).toBe(600);
    document.querySelector('button[aria-label="Remove photo 1"]').click();flushSync();expect(edit.draft.images).toEqual([]);
    edit.revert();flushSync();expect(edit.snapshot().images).toEqual(images);expect(edit.dirty).toBe(false);
  });
  it('adds a pasted image to the draft and saves its data URL through the regular save path',async()=>{
    preparePhoto.mockResolvedValue({url:'data:image/png;base64,YQ=='});
    const {edit,data}=show();const event=new Event('paste',{bubbles:true,cancelable:true});
    Object.defineProperty(event,'clipboardData',{value:{files:[new File(['photo'],'pie.png',{type:'image/png'})]}});
    document.querySelector('[aria-label="Photo paste area"]').dispatchEvent(event);await wait();
    expect(event.defaultPrevented).toBe(true);await vi.waitFor(()=>expect(edit.dirty).toBe(true));
    await edit.save();expect(data.updateRecipe.mock.calls[0][0].images[0].url).toBe('data:image/png;base64,YQ==');
  });
  it('does not append an in-flight import after Revert',async()=>{
    let finish;preparePhoto.mockReturnValue(new Promise(resolve=>finish=resolve));
    const {edit}=show();const input=document.querySelector('input[type=file]');
    Object.defineProperty(input,'files',{value:[new File(['x'],'pie.png',{type:'image/png'})]});
    input.dispatchEvent(new Event('change',{bubbles:true}));await wait();
    edit.revert();finish({url:'data:image/png;base64,YQ=='});await wait();
    expect(edit.dirty).toBe(false);expect(edit.draft.images).toEqual([]);
  });
  it('keeps existing photos when URL import fails and shows the error',async()=>{
    photoFromUrl.mockRejectedValue(new Error('Could not fetch photo'));
    const {edit}=show([{url:'data:image/png;base64,YQ=='}]);
    const input=document.querySelector('input[type=url]');input.value='https://images.example/photo.png';input.dispatchEvent(new Event('input',{bubbles:true}));flushSync();
    [...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Import photo').click();await wait();
    await vi.waitFor(()=>expect(document.querySelector('[role=alert]')?.textContent).toContain('Could not fetch photo'));expect(edit.dirty).toBe(false);
  });
});
