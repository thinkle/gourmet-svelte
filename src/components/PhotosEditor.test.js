import { afterEach, beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import PhotosEditor from '../screens/recipe/edit/PhotosEditor.svelte';
import { RecipeEdit } from '../app/editState.svelte.js';
import { preparePhoto, photoFromUrl } from '../app/recipePhotos.js';
vi.mock('../app/recipePhotos.js',()=>({preparePhoto:vi.fn(),photoFromUrl:vi.fn(),photosFit:()=>true}));
let component;
const showModal=HTMLDialogElement.prototype.showModal,closeDialog=HTMLDialogElement.prototype.close;
beforeAll(()=>{
  HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  HTMLDialogElement.prototype.close=function(){this.open=false;};
});
afterAll(()=>{HTMLDialogElement.prototype.showModal=showModal;HTMLDialogElement.prototype.close=closeDialog;});
afterEach(async()=>{if(component) await unmount(component);document.body.innerHTML='';vi.resetAllMocks();});
function show(images=[]) {
  const data={updateRecipe:vi.fn(async r=>r)};
  const edit=new RecipeEdit({id:1,title:'Pie',images},{data});
  component=mount(PhotosEditor,{target:document.body,props:{edit}});flushSync();return {edit,data};
}
const wait=async()=>{await Promise.resolve();await Promise.resolve();flushSync();};
const click=(text)=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===text);expect(b,`button ${text}`).toBeTruthy();b.click();flushSync();};
const openPicker=()=>click('Add photo…');
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
    const {edit}=show();openPicker();
    const input=document.querySelector('input[type=file]');
    Object.defineProperty(input,'files',{value:[new File(['x'],'pie.png',{type:'image/png'})]});
    input.dispatchEvent(new Event('change',{bubbles:true}));await wait();
    edit.revert();finish({url:'data:image/png;base64,YQ=='});await wait();
    expect(edit.dirty).toBe(false);expect(edit.draft.images).toEqual([]);
  });
  it('keeps existing photos when URL import fails and shows the error',async()=>{
    photoFromUrl.mockRejectedValue(new Error('Could not fetch photo'));
    const {edit}=show([{url:'data:image/png;base64,YQ=='}]);openPicker();
    const input=document.querySelector('input[type=url]');input.value='https://images.example/photo.png';input.dispatchEvent(new Event('input',{bubbles:true}));flushSync();
    click('Import photo');await wait();
    await vi.waitFor(()=>expect(document.querySelector('[role=alert]')?.textContent).toContain('Could not fetch photo'));expect(edit.dirty).toBe(false);
  });
});
describe('the add-a-photo dialog',()=>{
  it('keeps the three ways to add behind one button and closes once a photo lands',async()=>{
    preparePhoto.mockResolvedValue({url:'data:image/png;base64,YQ=='});
    const {edit}=show();
    // Nothing but the trigger until it is opened.
    expect(document.querySelector('input[type=url]')).toBeNull();
    expect([...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Paste photo')).toBe(false);
    openPicker();
    expect(document.querySelector('input[type=url]')).toBeTruthy();
    expect([...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Paste photo')).toBe(true);
    const input=document.querySelector('input[type=file]');
    Object.defineProperty(input,'files',{value:[new File(['x'],'pie.png',{type:'image/png'})]});
    input.dispatchEvent(new Event('change',{bubbles:true}));await wait();
    await vi.waitFor(()=>expect(edit.draft.images).toHaveLength(1));
    await vi.waitFor(()=>expect(document.querySelector('input[type=url]')).toBeNull());
  });

  // The input has to outlive the dialog: a photo chosen from the device
  // arrives on its change event, which can land after the dialog is gone --
  // a backdrop tap while the phone's photo sheet is still up. So it is not
  // allowed back inside the dialog, dismissible or not.
  it('keeps the file input outside the dialog, where it survives a dismissal',async()=>{
    show();
    const before=document.querySelector('input[type=file]');
    expect(before,'file input is there before the dialog opens').toBeTruthy();
    openPicker();
    const input=document.querySelector('input[type=file]');
    expect(input.closest('dialog')).toBeNull();
    const clicks=[];input.addEventListener('click',()=>clicks.push(1));
    click('Choose photo…');
    expect(clicks).toHaveLength(1);
  });

  it('says so rather than dropping a photo when the draft changed underneath',async()=>{
    let finish;preparePhoto.mockReturnValue(new Promise(resolve=>finish=resolve));
    const {edit}=show();openPicker();
    const input=document.querySelector('input[type=file]');
    Object.defineProperty(input,'files',{value:[new File(['x'],'pie.png',{type:'image/png'})]});
    input.dispatchEvent(new Event('change',{bubbles:true}));await wait();
    edit.revert();finish({url:'data:image/png;base64,YQ=='});await wait();
    await vi.waitFor(()=>expect(document.querySelector('[role=alert]')?.textContent).toMatch(/Add it again/));
    expect(edit.draft.images).toEqual([]);
  });
  it('shuts an open picker when the draft is replaced',async()=>{
    const {edit}=show();openPicker();
    expect(document.querySelector('input[type=url]')).toBeTruthy();
    edit.revert();flushSync();await wait();
    expect(document.querySelector('input[type=url]')).toBeNull();
  });
});
