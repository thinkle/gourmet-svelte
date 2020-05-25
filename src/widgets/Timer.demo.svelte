<script>
 export let initialShow
 import Timer from './Timer.svelte';
 import Tester from './Tester.svelte';
</script>
<Tester name="Timer" initialShow="{initialShow}">
    <Timer duration="3600" />
    <Timer duration="2600" />
    <Timer duration="1760" />
    <Timer duration="68" />
    <Timer duration="5" />
</Tester>
