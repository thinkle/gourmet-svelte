<script>
 import OneLiner from './OneLiner.svelte';
 import {Lorem} from '../'
</script>

<div style="width:200px">
    <p>In a 200px div</p>
    <OneLiner>
        <Lorem chars="{300}"/>
    </OneLiner>
</div>
<div class="grid" style="width:200px">
    <p>In a grid layout</p>
    <OneLiner>
        <Lorem chars="{300}"/>
    </OneLiner>
    <OneLiner>
        <Lorem chars="{300}"/>
    </OneLiner>
    <OneLiner>
        <Lorem chars="{300}"/>
    </OneLiner>
    <OneLiner>
        <Lorem chars="{300}"/>
    </OneLiner>
    <OneLiner>
        <Lorem chars="{300}"/>
    </OneLiner>
</div>

<style>
 .grid {
     display: grid;
     grid-template-columns: 150px 150px 150px;
     grid-spacing: 5px;
 }
</style>
