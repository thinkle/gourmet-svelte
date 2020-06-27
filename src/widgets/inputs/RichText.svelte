<script>
 import '../../../node_modules/quill/dist/quill.snow.css';
 import { onMount } from "svelte";
 export let initialValue=''
 let value = initialValue;
 let editor;
 import Quill from 'quill';
 import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
 
 export let toolbarOptions = [
     [{ header: 1 }, { header: 2 }, "blockquote", "link", "image", "video"],
     ["bold", "italic", "underline"],
     [{ list: "ordered" }, { list: "bullet" }],
     ["clean"]
 ];

 let quill

 function setContents (html) {
     if (!quill) return
     const delta = quill.clipboard.convert(html);
     quill.setContents(delta);
 }
 
 onMount(async () => {
     quill = new Quill(editor, {
         modules: {
             toolbar: toolbarOptions
         },
         theme: "snow",
         placeholder: "Type text here..."
     });     
     quill.on('text-change', function(delta) {
         dispatch('change',quill.root.innerHTML);
         value = quill.root.innerHTML;
     });
     
 });

 $: {
     quill && setContents(initialValue)
 }

</script>

<div class="editor-wrapper">
    <div bind:this={editor} />
</div>

<style>
 div div :global([contenteditable]) {
     border: none;
 }
 div div {
     min-height: 15em;
     border: 1px solid #ccc;
 }

 div :global([contenteditable]) {
     font-family: var(--recipeFont);
     font-size : 1rem;
     line-height: 1.4;
     max-width: 45em; /* readability... */
 }

 div :global(h1),div :global(h2),div :global(h3),div :global(h4),div :global(h5),div :global(h6) {
     margin-bottom: 3px;
     border-bottom: 1px solid var(--light-underline);
 }
 .editor-wrapper {
     border: 2px solid var(--light-underline);
 }
 .editor-wrapper:focus-within {
     border: 2px solid var(--accent-bg);
     transition: all 300ms;
 }
 :global(.ql-toolbar) {
     border: 10px solid green;
 }
 .editor-wrapper :global(.ql-toolbar) {
     opacity: 0;
     visibility: hidden;
     transition: opacity 300ms;
     overflow: hidden;
     box-sizing: border-box;
     max-height: 0;
     padding : 0;
     transition: max-height 300ms;
 }
 .editor-wrapper:focus-within :global(.ql-toolbar) {
     opacity: 1;
     visibility: visible;
     max-height: 60px;
     padding: 8px; /* Hard-coded copied from ql-snow... */
 }

</style>
