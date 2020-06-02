<script>
 import {onMount} from 'svelte'
 export let value=""
 export let minFontSize = 11
 export let placeholder=''
 export function focus () {
     ref.focus();
 }
 
 let ref;
 let fontSize;
 let shrunkForText = '';
 let oneLiner = true;
 let justHadFocus;
 let selection;

 $: if (!value) {value = ''}
 
 $: if (justHadFocus && selection && ref.tagName != selection.origin) {
     justHadFocus = false;
     ref.focus()
     if (ref.tagName=='INPUT') {
         ref.setSelectionRange(
             selection.start,
             selection.end,
             selection.direction
         ); // set input selection
     }
     else {
         // set contenteditable selection...
         let range = document.createRange();
         let textNode = ref.childNodes[0]
         range.setStart(textNode,selection.start);
         range.setEnd(textNode,selection.end);
         let sel = window.getSelection();
         sel.removeAllRanges();
         sel.addRange(range);
     }
     selection = {}; // empty selection out so we don't re-select later by mistake
 }
 
$: if (value && ref) {adjustSize()}

function adjustSize () {     
     // adjust value...
     if (shrunkForText.length > value.length) {
         fontSize = undefined;
         oneLiner = true;
         justHadFocus = document.activeElement==ref
         if (ref.tagName!='input') {
             let range = window.getSelection().getRangeAt(0);
             selection = {
                 start:range.startOffset,
                 end:range.endOffset,
                 direction:'none',
                 origin:'DIV'
             }
         }
     }
     if (ref.scrollWidth > ref.clientWidth) {
         if (oneLiner && !fontSize || fontSize > minFontSize) {
             fontSize = window.getComputedStyle(ref).getPropertyValue('font-size');
             let percentageTarget = ref.clientWidth/ref.scrollWidth
             fontSize = Number(fontSize.split('px')[0])
             fontSize = Math.max(fontSize * percentageTarget,minFontSize);
             shrunkForText = value;
         }
         else {
             shrunkForText = value;
             oneLiner = false;
             justHadFocus = document.activeElement==ref
             selection = {
                 start:ref.selectionStart,
                 end:ref.selectionEnd,
                 direction:ref.selectionDirection,
                 origin:'INPUT',
             }
         }
     }
 }

 function getStyle () {
     if (fontSize) {
         return `font-size: ${fontSize}px`
     }
 }

     onMount(adjustSize)

</script>

{#if oneLiner && false}
    <input placeholder={placeholder} style={getStyle(fontSize)} bind:this={ref} on:change on:keyup on:keydown bind:value={value} type="text">
{:else}
    <p class="input" placeholder={placeholder} contenteditable="true" bind:textContent={value} on:change on:keyup on:keydown bind:this={ref}>
        {value}
    </p>
    {/if}
<style>
 input {
     width : 100%
 }
 .input {
     width : 100%;
     margin: 0;
     flex-grow: 1;
 }
</style>
