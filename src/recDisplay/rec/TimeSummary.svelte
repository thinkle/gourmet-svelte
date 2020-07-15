<script>
 export let rec
 export let onReadTimes

 import {TimeLink,JsonDebug} from '../../widgets/';
 import {extractTimes} from '../../utils/times.js';

 let times = []

 $: times = getTimes(rec);
 
 function getTimes (rec) {
     if (rec.times) {
         times = [...rec.times]
     } else {
         times = [];
     }
     if (rec.text) {
         for (let text of rec.text) {
             const extracted = extractTimes(text.body);
             console.log('extracted ',extracted.length,'from text',text);
             times = [...times,...extracted]
         }
     }
     if (onReadTimes) {onReadTimes(times)}
     return times
 }

 
</script>

<div>
    {#each times as time}
        <!-- <JsonDebug data={time}/>
             <br>text: {time.text}
             <br>secs: {time.seconds}
             <br>sentence : {time.sentence} -->
        {#if time.name}
            <TimeLink
                value="{time}"
            />
        {:else}
            <TimeLink
                label="{time.sentence}"
                seconds="{time.seconds}"
                timestring="{time.text}"
            />
        {/if}
    {/each}
</div>
<style>
 div {
     display: grid;
     grid-template-columns: 49% 1px 50%;   /* WARNING: Tied to internals of TimeLink.svelte  */
     grid-row-gap: 1em;
     grid-column-gap: 5px;
 }

 div > :global(*:nth-child(3n)) { /* Ugly */
     justify-self: flex-end;
 }
</style>
