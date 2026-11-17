<script>
 export let grow=true;
 export let flexgrow=false;

</script>

<span class:grow class:flexgrow>
    <slot/>
</span>

<style>

 .flexgrow {
     flex-grow: 1;
 }
 
 .grow {
     width: 100%;
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
