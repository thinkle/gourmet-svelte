<script>

 import WL from './WhiskLogo.svelte';
 import SP from './SearchProgress.svelte';
 export let initialShow
</script>

<h3>Whisk</h3>
<br>
<WL/>
<h3>Restarting Whisk</h3>
<br>
<WL autorestart=true/>
<hr>
<h3>Search</h3>
<br><SP/>
<p>All she wrote...</p>

<style>
    h3 {font-size: 2rem}
</style>

