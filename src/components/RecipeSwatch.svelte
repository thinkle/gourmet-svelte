<script>
  // The recipe's colour pair as a small two-tone chip, split at the golden
  // ratio like the old Gourmet card; the photo sits on it when there is one.
  let { recipe } = $props();
</script>

<span class="swatch" class:photo={recipe.image} style="--swatch-bg: {recipe.color.bg}; --swatch-fg: {recipe.color.fg};">
  {#if recipe.image}<img src={recipe.image} alt="" loading="lazy" />{/if}
</span>

<style>
  .swatch {
    display: block;
    width: var(--swatch-size, 3.5rem);
    height: var(--swatch-size, 3.5rem);
    border-radius: 0.5rem;
    overflow: hidden;
    position: relative;
    background: linear-gradient(to bottom, var(--swatch-bg) 0 61.8%, var(--swatch-fg) 61.8% 100%);
  }
  /* With a photo the pair shrinks to a spine down the leading edge. */
  .swatch.photo {
    background: linear-gradient(to bottom, var(--swatch-bg) 0 61.8%, var(--swatch-fg) 61.8% 100%);
  }
  .swatch img {
    position: absolute;
    inset: 0 0 0 0.375rem;
    width: calc(100% - 0.375rem);
    height: 100%;
    object-fit: cover;
    border-radius: 0;
  }
</style>
