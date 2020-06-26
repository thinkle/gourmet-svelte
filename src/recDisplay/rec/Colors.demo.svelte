<script>
 import {wordColors} from './colors.js'
 import {Lorem} from '../../widgets/'
 import RecipeTextStyle from '../text/RecipeTextStyle.svelte';
</script>

{#each wordColors as wordColor}
    <div style="{(`--accent-bg: ${wordColor.color.bg}; --accent-fg: ${wordColor.color.fg};`||'')}">
        <h2
            style="{`
            border-bottom: 3px solid var(--accent-bg);
            `}"
        >{wordColor.matcher} <span>{wordColor.contrast.toFixed(2)}</span></h2>
        <div style="color: var(--accent-fg); background-color: var(--accent-bg);"> Regular <Lorem/></div>
        <div style="color: var(--accent-bg); background-color: var(--accent-fg);"> Inverted <Lorem/></div>
        <RecipeTextStyle>
            <ul><li>An unordered list</li><li><Lorem graphs="2"/></li></ul>
            <ol><li>An ordered list</li><li><Lorem graphs="2"/></li></ol>
        </RecipeTextStyle>
    </div>
{/each}
<style>
 h2 {
     
     font-size: 2rem;
     font-weight: bold;
     margin-bottom: 1em;
 }
 span {
     display: inline-block;
     padding: 4px;
     background-color: var(--accent-bg);
     color: var(--accent-fg);
 }

 
</style>
