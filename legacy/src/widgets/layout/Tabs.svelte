<script context="module">
 let tabsCount = 0;
</script>

<script>
 import {registerBuild} from '../../stores/debugStore.js'; registerBuild(Number("BUILD_MS"));
 export let standalone=false;
 export let sticky=false;
 export let stickyTop = undefined;
 export let data=undefined;
 export let handleActive=false;
 export let nowrap=false
 
 import {flip} from 'svelte/animate';
 import Tab from './Tab.svelte';

 if (sticky && !stickyTop) {
     stickyTop = 0
 }

 if (!data && handleActive) {
     console.log("Tabs.svelte WARNING: You passed Tabs handleActive but not any data. Tabs can't manage  slots if you're using it in slots mode.");
 }

 function handleClick (tab) {
     if (handleActive) {
         for (let t of data) {
             if (t==tab || t.key==tab.key) {
                 t.active = true;
             }
             else {
                 t.active = false;
             }
         }
         data = data;
     }
     if (tab.action) {
         tab.action();
     }
 }
 let myIdentifier = tabsCount;
 tabsCount += 1;
</script>

<ul class:sticky
    class:nowrap
    class:standalone
    class="tabs"
    style="{`top:${stickyTop}`}"
    tabIdentifier="{myIdentifier}"
>
    <slot>
        {#if data}
            {#each data as tab (tab.key)}
                <div animate:flip>
                    <Tab active="{tab.active}" on:click="{()=>handleClick(tab)}">{tab.label}</Tab>
                </div>
            {/each}
        {:else}
            Either provide data or a slot, please :)
        {/if}
    </slot>
</ul>

<style>
 .tabs {
     display: flex;
     flex-direction: row;
     background-color: white;
     width: 100%;
     margin-bottom: 3px;
 }
 .sticky {
     position: sticky;
     top: 0;
 }
 .nowrap {
     overflow-x: scroll;
     flex-shrink: 0;
 }
 .nowrap :global(*) {
     white-space : nowrap;
 }
 .standalone {
     padding: 0 var(--side-pad, 1rem);
 }

 @media screen and (max-width: 920px) {
    .tabs {
        font-size: 60%
    }
}
@media print {
    .tabs {
        color: green;
        display: none;
    }
}
</style>

