<script>
 import Tester from './Tester.svelte';
 import WL from './WhiskLogo.svelte';
 import SP from './SearchProgress.svelte';
 export let initialShow
</script>
<Tester  name="SVG Fanciness" {initialShow}>
    <h3>Whisk</h3>
    <br><WL/>
    <hr>
    <h3>Search</h3>
    <br><SP/>
</Tester>
