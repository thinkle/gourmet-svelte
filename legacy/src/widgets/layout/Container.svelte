<div>
    <slot/>
</div>

<style>
 div {
     overflow-y: scroll;
     position: sticky;
     max-height: calc(100vh - var(--container-top));
     top: 0;
 }
</style>
