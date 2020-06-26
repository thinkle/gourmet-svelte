<script>
 export let grow=true;
</script>

<span class:grow>
    <slot/>
</span>

<style>

 .grow {
     width: 100%;
     flex-grow: 1;
 }

 span {
     display: inline-block;
     border-bottom: var(--inputBorder);
     padding-bottom: var(--inputPadding);
     position: relative;
     margin-bottom: var(--inputPadding);
     box-sizing: content-box;
 }

 span :global(input),
 span :global([contenteditable]) {
     border: none;
     border-color: transparent;
 }

 span::after {
     content: " ";
     display: block;
     width: 0;
     height: 2px;
     position: absolute;
     bottom: 0;
     background-color: var(--inputBorderColor);
 }

 span:focus-within::after {
     content: " ";
     display: block;
     width: 100%;
     height: 2px;
     position: absolute;
     bottom: 0;
     transition: all 300ms;
     background-color: var(--accent-bg);
 }
 
</style>
