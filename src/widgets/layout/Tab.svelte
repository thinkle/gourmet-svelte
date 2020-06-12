<script>
 export let active=false;

</script>
<li class:active on:click tabindex="0">
    <slot/>
</li>

<style>
 
 li {
     list-decoration: none;
     border-bottom: 1px solid var(--light-underline);
     padding: 0.5em;
     margin-right: 3px;
     font-weight: 300;
     transition: all 300ms;
     display: flex;
     /* max-width: 15em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap; */
 }

 li.active {
     font-weight: 500;
     border-bottom: 3px solid var(--heavy-underline);
 }

 li:hover {
     border-bottom: 3px solid var(--medium-underline);
     background-color: var(--light-bg);
     color: var(--light-fg);
     font-weight: 500;
     background: var(--light-bg) radial-gradient(circle, transparent 1%, var(--light-bg) 1%) center/15000%;
 }

 li:active {
     background-color: var(--medium-bg);
     color: var(--medium-fg);
     background-size: 100%;
     transition: background 0s;
 }
</style>
