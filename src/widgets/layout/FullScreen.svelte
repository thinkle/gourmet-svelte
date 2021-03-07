<script>
  export let header = true;
  export let footer = true;
  export let headerHeight = "28px";
  export let footerHeight = "28px";
  export let scrolls = true;

  import FullHeight from "./FullHeight.svelte";
</script>

<article
  style={`--header-height:${headerHeight};
                 --footer-height:${footerHeight};
                --container-top:${headerHeight};
                `}
>
  {#if header}<section class="header" style={`--bar-height:${headerHeight}`}>
      <slot name="header" />
    </section>{/if}
  <FullHeight {scrolls}>
    <slot name="main" />
  </FullHeight>
  {#if footer}<section class="footer" style={`--bar-height:${footerHeight}`}>
      <slot name="footer" />
    </section>{/if}
</article>

<style>
  .header {
    background-color: var(--white);
    color: var(--black);
    height: var(--header-height);
    padding: 3px;
    border-bottom: 1px solid var(--light-underline);
    font-family: var(--uiFont);
  }

  .footer {
    background-color: var(--white);
    color: var(--black);
    border-top: 1px solid var(--light-underline);
    padding: 3px;
    height: var(--footer-height);
    font-family: var(--uiFont);
  }

  article {
    height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
    position: fixed;
    left: 0;
    top: 0;
  }

  @media print {
    article {
      display: block;
      height: auto;
      width: auto;
      position: static;
    }
  }
</style>
