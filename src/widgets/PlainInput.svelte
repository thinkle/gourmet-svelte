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
 
 $: if (justHadFocus && selection && ref.tagName != selection.origin) {
     justHadFocus = false;
     ref.focus()
     console.log('Grabbed focus!');
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
     console.log('Check value? current length:',value.length,
                 'we last shrunk for ',shrunkForText.length);
     if (shrunkForText.length > value.length) {
         console.log('Undo shrinkage...')
         fontSize = undefined;
         oneLiner = true;
         justHadFocus = document.activeElement==ref
         if (ref.tagName!='input') {
             console.log('Going from div to input now...');
             let range = window.getSelection().getRangeAt(0);
             selection = {
                 start:range.startOffset,
                 end:range.endOffset,
                 direction:'none',
                 origin:'DIV'
             }
         }
         console.log('just had focus?',justHadFocus)
     }
     if (ref.scrollWidth > ref.clientWidth) {
         if (oneLiner && !fontSize || fontSize > minFontSize) {
             console.log('Try shrinking...');
             fontSize = window.getComputedStyle(ref).getPropertyValue('font-size');
             console.log('Got font size: ',fontSize);
             let percentageTarget = ref.clientWidth/ref.scrollWidth
             fontSize = Number(fontSize.split('px')[0])
             fontSize = Math.max(fontSize * percentageTarget,minFontSize);
             shrunkForText = value;
         }
         else {
             console.log('changing to contenteditable');
             shrunkForText = value;
             oneLiner = false;
             justHadFocus = document.activeElement==ref
             console.log('just had focus?',justHadFocus)
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
{#if oneLiner}
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
</style>
