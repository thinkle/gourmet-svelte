<script>
 import {Tester} from '../index.js';
 import IngredientInput from './IngredientInput.svelte';
 let ii;
 let v;
 export let initialShow;
 let changedV
 let text='2 to 3 cups flour'
 let ing = {
     amount : {
         rangeAmount : 3.5,
         amount : 5.33333,
         unit : 'teaspoons'
     },
     text : 'sugar, granulated'
 }
</script>

<Tester name="Ingredient Input" initialShow={initialShow}>
    <label on:click={()=>ii.focus()}>Ing:</label>
    <p>Set from text: </p>
    <IngredientInput bind:this={ii} text={text} onEnter={(val)=>{v=val;ii.clear()}} onInput={(val)=>changedV=val} />
    <button on:click={()=>v=ii.getValue()}>Get value</button>
    <p>onEnter Value: {JSON.stringify(v)}</p>
    <p>onInput val: {JSON.stringify(changedV)}</p>
    <p>Set from ingredient, with onChange call only (no onInput or we screw up typing)</p>
    <IngredientInput ing={ing} onChange={(val)=>ing=val} />
    <p>Ing={JSON.stringify(ing)}</p>
</Tester>

