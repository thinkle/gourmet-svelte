<script>
 export let bg = 'var(--white)';
 export let fg = 'var(--black)';

</script>
<span class="container">
    <span class="overflow" style="{`color:${fg};background-color:${bg};`}"><slot/></span>
    <span class="oneline"><slot/></span>
</span>

<style>
 .container {
     position: relative;
 }
 span.overflow {
     display: none;
     position: absolute;
     /* top: 0;
        left: 0; */
     z-index: 2;
 }
 span:hover .overflow {
     display: inline-block;
 }

 span.oneline {
     display: inline-block;
     width: 100%;
     text-overflow: ellipsis;
     overflow-x: hidden;
     min-height: 1.2em; /* make room for descenders, working around annoying display bug... */ 
     white-space: nowrap;
 }
 span:hover .oneline {
     visibility: hidden;
 }
 
</style>
    
