<script>
 export let modalVisible
 import {send,receive} from './transitions/modalTransition.js'
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
