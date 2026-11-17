<div>
  <slot/>
</div>

<style>
  div {
    display: flex;
    flex-direction: column;
    padding: 4px;
  }
  div > :global(*) {
    margin-top: 4px;
  }
  div > :global(*:first-child) {
    margin-top: 0;
  }
</style>