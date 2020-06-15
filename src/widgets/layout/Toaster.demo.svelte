<script>
 import Toaster from './Toaster.svelte';
 import {FullHeight,Button,Progress} from '../'
 let delay=10000
 let toaster
 let busy
</script>
<FullHeight>
    <div>
        Delay: <input type="number" bind:value="{delay}" >
        <Button toggle="{true}" toggled="{busy}" on:click="{()=>busy=!busy}">Make Busier</Button>
        <Button on:click="{toaster.popUp}">Click for toast</Button>
    </div>
</FullHeight>
<Toaster bind:this="{toaster}" {delay}>
    This is a message in the toaster. <b>with markup</b>
    {#if busy}
        <p>Here is more content</p>
        <Progress amount="{47}" total="{99}"/>
        <table>
            <tr><td colspan="2">Results</td></tr>
            <tr><td>Red Team</td><td>2</td></tr>
            <tr><td>Blue Team</td><td>3</td></tr>
            <tr><td>Green Team</td><td>7</td></tr>
        </table>
    {/if}
</Toaster>
