<script>
  // A rating as five stars. Stored ratings run 0-10, so each star is 2.
  // Click a star to set it, click the lit last star again to clear; arrow
  // keys step, 0-5 set.
  let { value = 0, onchange, label = "Rating" } = $props();
  const lit = $derived(Math.round((Number(value) || 0) / 2));
  const set = (stars) => onchange?.(Math.max(0, Math.min(5, stars)) * 2);
  function onkeydown(e) {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); set(lit + 1); }
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); set(lit - 1); }
    else if (/^[0-5]$/.test(e.key)) set(Number(e.key));
  }
</script>

<span class="star-input" role="slider" tabindex="0" aria-label={label} aria-valuemin="0" aria-valuemax="5"
  aria-valuenow={lit} aria-valuetext="{lit} of 5 stars" {onkeydown}>
  {#each [1, 2, 3, 4, 5] as n}
    <button type="button" tabindex="-1" class="star" class:lit={n <= lit} aria-label="{n} star{n > 1 ? 's' : ''}"
      onclick={() => set(n === lit ? 0 : n)}>★</button>
  {/each}
</span>
