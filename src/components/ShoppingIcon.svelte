<script>
  let { kind, size = 20 } = $props();
</script>

<!-- Rounded, biscuit-colored kitchen symbols, drawn to stay clear at 20px. -->
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
  {#if kind === "pantry"}
    <rect x="4" y="3" width="16" height="18" rx="2" fill="var(--shopping-icon-fill, var(--primary-fg))" />
    <path d="M12 3v18M9 10v4m6-4v4" />
  {:else if kind === "cart"}
    <path d="m5 6 2 9h12l2-9Z" fill="var(--shopping-icon-fill, var(--primary-fg))" />
    <path d="M2 3h2l3 12-1 3h13M10 9v3m5-3v3" />
    <circle cx="8" cy="21" r="1" fill="currentColor" stroke="none" />
    <circle cx="18" cy="21" r="1" fill="currentColor" stroke="none" />
  {:else if kind === "live"}
    <path d="M8 7a6 6 0 0 1 10 3m-2-4 3 4 2-4M16 17a6 6 0 0 1-10-3m2 4-3-4-2 4" />
    <path d="m9 12 2 2 4-4" />
  {:else}
    <path d="M3 5a2 2 0 0 1 2-2h6l10 10a2 2 0 0 1 0 3l-5 5a2 2 0 0 1-3 0L3 11Z" fill="var(--shopping-icon-fill, var(--primary-fg))" />
    <circle cx="7.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
    <path d="m11 12 5 5m-2-8 5 5" />
  {/if}
</svg>
