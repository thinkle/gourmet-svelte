<script>
	export let height = '200px';
	export let growRight = true;
	export let growLeft  = false;
	export let growEven = false;
</script>

<div class="top" style="--height:{height}"
     class:growRight
     class:growLeft
     class:growEven
>
    <div class="side l">
	<div class="head scrollHead">
	    <slot name="leftHead">
	    </slot>
	</div>
	<div class="scrollBox">
	    <slot name="left"></slot>
	</div>
	
    </div>
    <div class="side r">
	<div class="head scrollHead">
	    <slot name="rightHead">
	    </slot>
	</div>
	<div class="scrollBox">
	    <slot name="right"></slot>
	</div>
	
    </div>
</div>

<style>
	.head > :global(*) {
		font-size: 70%;	
		border-bottom: 5px solid var(--grey);
		margin: 0;
		padding-bottom: 3px;
	}
	.side {
		display: flex;
		flex-direction: column;
		padding: 11px;
	}
	.side .scrollBox {
		flex-grow: 1;
	}
	.growEven .l,.growLeft .l {
		flex-grow: 1
	}
	.growEven .r, .growRight .r {
		flex-grow: 1;
	}
	.top {
		display: flex;
		background-color: 100px;
	}
	.scrollBox {
		overflow-y: scroll; 
	}
	.l {

		height: var(--height);
	}
	.r {

		height: var(--height);
	}
</style>
