<script>
 import RecipeText from './RecipeText.svelte';
 let hidden=false;
 export let initialShow
 let value = {
     header : 'Instructions',
     body :` How about a 5 second timer for testing?<br>
<p>These are instructions. Bake for 30 minutes, or maybe 35 minutes, or whatever happens to commas in 10 seconds, at 350 degrees.</p>
<p>Are some of them getting lost?</p>
<p>Then cook for 25 minutes</p>
     `,
     foo:'bar'
 }
 
 
</script>



<RecipeText value={value} />
<textarea bind:value={value.body}></textarea>

<button
    on:click={()=>hidden=!hidden}
>Toggle</button>
{#if !hidden}
    <RecipeText value={value} />
{/if}


