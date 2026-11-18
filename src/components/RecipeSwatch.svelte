<script>
  // The recipe's colour as a small circle: its colour over its accent (the
  // accent is the text colour when a palette has none), split at the golden
  // ratio like the old Gourmet card. With a photo, the photo fills the circle
  // and the same two colours become a ring around it.
  let { recipe } = $props();
  const c = $derived(recipe.color);
</script>

<span class="swatch" class:photo={recipe.image} style="--swatch-bg: {c.bg}; --swatch-accent: {c.accent ?? c.fg};">
  {#if recipe.image}<img src={recipe.image} alt="" loading="lazy" />{/if}
</span>

<style>
  .swatch {
    display: block;
    box-sizing: border-box;
    width: var(--swatch-size, 3.5rem);
    height: var(--swatch-size, 3.5rem);
    border-radius: 50%;
    overflow: hidden;
    background: linear-gradient(to bottom, var(--swatch-bg) 0 61.8%, var(--swatch-accent) 61.8% 100%);
  }
  /* The ring is split on the diagonal so both colours show on a thin edge. */
  .swatch.photo {
    padding: max(0.25rem, 8%);
    background: linear-gradient(135deg, var(--swatch-bg) 0 50%, var(--swatch-accent) 50% 100%);
  }
  /* `.photo >` outranks Contain's DataList rule that rounds icon images. */
  .swatch.photo > img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
</style>
