<script>
 import ShoppingListItems from './ShoppingListItems.svelte';
 import JsonDebug from '../widgets/JsonDebug.svelte';
 import items from './demoItems.js';

</script>
<h2>Items:</h2>
<p>Note: functionality which depends on the store won't work in this mock-up, which has hard-coded items.</p>
<ShoppingListItems {items} />
<JsonDebug data="{items}" />
