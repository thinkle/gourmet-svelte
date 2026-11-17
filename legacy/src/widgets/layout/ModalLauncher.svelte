<script>
 export let modalVisible
 export let key
 import {getCrossfade} from '../transitions/modalTransition.js'
 let [send,receive] = getCrossfade(key);
</script>


<slot/>
{#if !modalVisible}
<div out:send={{key:1}} in:receive={{key:1}}>
</div>
{/if}

<style>
 div {
     width: 1px;
     height: 1px;
 }
</style>
