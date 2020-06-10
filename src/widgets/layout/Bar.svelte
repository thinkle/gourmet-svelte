<script>
</script>
<div class="bar">
    <div class="left">
        <slot name="left"/>
    </div>
    <div class="center">
        <slot name="center"/>
    </div>
    <div class="right">
        <slot name="right"/>
    </div>
</div>

<style>
 .bar {
     display: flex;
     height: var(--bar-height);
     padding: 0.5rem 1rem;
     line-height: 1.5;
     align-items: center;
 }

 .center {
     margin-left: auto;
     margin-right: auto;
 }

 .right {
     margin-left: auto;
 }
 .left {
     margin-right: auto;
 }
</style>
