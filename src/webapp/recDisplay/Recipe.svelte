<script>
 import IL from './IngredientList.svelte';
 import SideBySide from '../../widgets/SideBySide.svelte';
 export let rec = {
     title : 'Test Recipe',
     ingredients : [
	 {amount:1,unit:'cup',item:'sugar'},
	 {amount:1,unit:'cup',item:'pease'},
	 {amount:3,unit:'large handfuls',item:'parsley, chopped small'},
	 {amount:1,unit:'generous slab',item:'bacon'},
     ]
 }

</script>

<div>
    <h2>
	{rec.title}
    </h2>
    <SideBySide height="60vh">
	<h3 slot="leftHead">
	    Ingredients
	</h3>
	<div slot="left">
	    <IL ingredients={rec.ingredients} maxWidth="350">
	    </IL>
	</div>		
	
	<div slot="right">
	    RECIPE GOES HERE in the right slot... and it might be super long.
	    <p>
		Wow look I am super long
	    </p>
	    <p>
		Wow look I am super long
	    </p>
	    <p>
		Wow look I am super long
	    </p>
	    <p>
		Wow look I am super long
	    </p>
	    <p>
		Wow look I am super long
	    </p>
	    <p>
		Wow look I am super long
	    </p>
	    <p>
		Wow look I am super long
	    </p>
	    <p>
		Wow look I am super long
	    </p>
	    <p>
		Wow look I am super long
	    </p>
	    <p>
		Wow look I am super long
	    </p>
	</div>
    </SideBySide>
</div>
