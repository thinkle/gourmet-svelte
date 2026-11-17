<script>
 export let icon=undefined
 export let iconSize=undefined;
</script>
<li>
    <button
        on:click
        on:focus
        on:blur
        on:keypress
        on:keyup
    >
        {#if icon}
            <i class:customSize={iconSize}  class="material-icons">
                {icon}
            </i>
        {/if}
        <slot/>
    </button>
</li>
<style>
 button {
     display: flex;
     flex-direction: row;
     -webkit-appearance: none;
     background: none;
     border: none;
     height: 100%;
     width: 100%;
     margin: 0;
 }
 button i {
     margin-right: auto;
 }
 button:focus {
     font-weight: bold;
     border: 1px solid var(--focus-border);
 }
 
 i.customSize {
     font-size: var(--iconSize) 
 }

</style>
