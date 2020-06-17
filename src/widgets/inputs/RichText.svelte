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
 onMount(async () => {
     quill = new Quill(editor, {
         modules: {
             toolbar: toolbarOptions
         },
         theme: "snow",
         placeholder: "Type text here..."
     });
     quill.pasteHTML(value);
     quill.on('text-change', function(delta) {
         dispatch('change',quill.root.innerHTML);
         value = quill.root.innerHTML;
     });
     
 });

 $: {
     quill && quill.pasteHTML(initialValue);
 }

</script>

<svelte:head>
    <!-- <link href="//cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet"> -->
</svelte:head>
<div>
    <div class="editor-wrapper">
        <div bind:this={editor} />
    </div>
</div>
<style>
 div div div :global([contenteditable]) {
     border: none;
 }
 div div div {
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

</style>
