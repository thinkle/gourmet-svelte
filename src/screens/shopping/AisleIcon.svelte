<script>
  import ShoppingIcon from "../../components/ShoppingIcon.svelte";
  let { kind, size = 28 } = $props();
</script>

{#if kind === "pantry"}
  <ShoppingIcon kind="pantry" {size} />
{:else}
  <svg width={size} height={size} viewBox="0 0 32 32" fill="var(--aisle-icon-fill)" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    {#if kind === "produce"}
      <!-- A plump carrot with three leafy sprigs. -->
      <path d="M20 10C10 10 5 24 5 27c3 0 17-5 17-15Z" />
      <path d="m20 11 1-6m1 6 5-6m-5 8 6-1M12 17l3 2m-6 2 2 1" fill="none" />
    {:else if kind === "bakery"}
      <path d="M4 15c0-6 5-10 12-10s12 4 12 10v10H4Z" />
      <path d="m10 10-2 5m9-6-2 5m9-3-2 5M4 21h24" fill="none" />
    {:else if kind === "meat"}
      <path d="M6 24C0 18 5 5 13 5c7 0 17 5 15 12-2 8-16 13-22 7Z" />
      <path d="M9 20C5 16 9 9 14 9s11 3 9 7-10 9-14 4Z" fill="none" />
      <path d="m12 13 2 2m4-3 2 2m-6 5 2 1" fill="none" />
    {:else if kind === "seafood"}
      <path d="M3 16c6-11 16-11 22-3l5-6v18l-5-6c-6 8-16 8-22-3Z" />
      <path d="M18 9q-4 7 0 14m-4-15 3-4 4 3m-7 17 3 4 4-3" fill="none" />
      <circle cx="9" cy="15" r="1" fill="currentColor" stroke="none" />
    {:else if kind === "deli"}
      <path d="m4 19 13-9 11 9v9H4Zm0 0h24M17 10v9" />
      <circle cx="10" cy="23" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="22" cy="24" r="1.5" fill="currentColor" stroke="none" />
      <path d="M5 13C1 9 8 3 14 5c4 1 5 3 4 6M8 10c-1-2 3-3 5-1" fill="none" />
    {:else if kind === "canned"}
      <path d="M6 7v18c0 4 20 4 20 0V7" />
      <ellipse cx="16" cy="7" rx="10" ry="4" />
      <ellipse cx="16" cy="7" rx="3" ry="1.5" fill="none" />
      <path d="M6 12c4 3 16 3 20 0M6 23c4 3 16 3 20 0m-12-5c-1-3 6-4 6-1s-5 4-6 1Z" fill="none" />
    {:else if kind === "grains"}
      <path d="M3 19h20c-1 6-4 9-10 9S4 25 3 19Z" />
      <path d="m7 15 2 1m3-3 2 1m3 1 2 1M23 23V5m0 5-5-4m5 9-5-4m5-1 5-4m-5 9 5-4m-5 9 5-4" fill="none" />
    {:else if kind === "international"}
      <circle cx="16" cy="16" r="12" />
      <ellipse cx="16" cy="16" rx="5" ry="12" fill="none" />
      <path d="M4 16h24M6 10h20M6 22h20" fill="none" />
    {:else if kind === "condiments"}
      <path d="M10 3h7v5l3 5v15H7V13l3-5Zm0 5h7M7 17h13m-13 7h13" />
      <path d="m24 10 4 6c3 5-5 7-6 3-1-3 2-5 2-9Z" />
    {:else if kind === "dairy"}
      <path d="m5 10 4-6h8l4 6v17H5Zm0 0h16M9 4l4 6v17" />
      <path d="M29 23c0 4-2 6-5 6s-5-2-5-6 3-10 5-10 5 6 5 10Z" fill="var(--aisle-bg, var(--current-bg))" />
      <path d="M22 24q0 2 2 2" fill="none" />
    {:else if kind === "baking"}
      <path d="m16 17 8-12m-5 13 8-12M4 17h24c-1 7-5 11-12 11S5 24 4 17Z" />
      <path d="M9 21q2 3 5 3M4 17h24" fill="none" />
      <path d="M9 11c-3-2 2-3 0-5m6 6c-3-2 2-3 0-5" fill="none" />
    {:else if kind === "spices"}
      <path d="M5 9h8v4l2 4v11H3V17l2-4Zm15-5h8v4l2 4v16H18V12l2-4Z" />
      <path d="M5 13h8M20 8h8M3 21h12m3-3h12" fill="none" />
      <circle cx="9" cy="24" r="1" fill="currentColor" stroke="none" />
      <path d="m22 22 4 3m0-3-4 3" fill="none" />
    {:else if kind === "frozen"}
      <path d="M16 3v26M5 9l22 14M5 23 27 9m-15-3 4 4 4-4m-8 20 4-4 4 4M5 14l5-2-1-5m18 11-5 2 1 5M5 18l5 2-1 5m18-11-5-2 1-5" fill="none" />
    {:else if kind === "coffee"}
      <path d="M5 12h17v10c0 4-3 6-8 6s-9-2-9-6Zm17 2h3c6 0 5 9-3 8" />
      <path d="M9 7c-3-2 2-3 0-5m6 5c-3-2 2-3 0-5M9 17v4" fill="none" />
    {:else if kind === "breakfast"}
      <path d="M3 16h26c-1 8-5 12-13 12S4 24 3 16Z" />
      <path d="m22 16 6-11M8 12l2-2 2 2m3-1 2-2 2 2M8 20q2 3 5 4" fill="none" />
    {:else if kind === "soda"}
      <rect x="8" y="4" width="16" height="25" rx="3" />
      <path d="M8 9h16M8 24h16m-8-19 3 2M8 18q8-8 16-2" fill="none" />
    {:else if kind === "juice"}
      <path d="m7 5 4 6H5l2 17h16l2-17H11m6 0 4-8h5" />
      <path d="M7 17h16" fill="none" />
      <circle cx="15" cy="22" r="3" fill="none" />
    {:else if kind === "alcohol"}
      <path d="M5 4h8v8c0 7-8 7-8 0Zm4 14v10m-4 0h8M5 10h8M22 3h4v6l3 5v14H19V14l3-5Z" />
      <path d="M22 8h4m-7 10h10m-10 6h10" fill="none" />
    {/if}
  </svg>
{/if}
