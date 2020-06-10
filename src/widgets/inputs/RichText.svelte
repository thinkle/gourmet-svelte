<script>
 import { onMount } from "svelte";
 export let initialValue=''
 let value = initialValue;
 let editor;
 import Quill from 'quill';
 import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
 
 export let toolbarOptions = [
     [{ header: 1 }, { header: 2 }, "blockquote", "link", "image", "video"],
     ["bold", "italic", "underline", "strike"],
     [{ list: "ordered" }, { list: "unordered" }],
     [{ align: [] }],
     ["clean"]
 ];

 let quill
 onMount(async () => {
     quill = new Quill(editor, {
         modules: {
             toolbar: toolbarOptions
         },
         theme: "snow",
         placeholder: "Write your story..."
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
    <link href="//cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
</svelte:head>
<div>
    <div class="editor-wrapper">
        <div bind:this={editor} />
    </div>
</div>
<style>

</style>
