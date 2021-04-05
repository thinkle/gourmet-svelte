<script>
  export let density = 0.6;
  let n = density * 3;
  $: n = density * 6;
  let l = [];
  $: {
    l = [];
    for (let i = 1; i <= n; i++) {
      l.push(i);
    }
    l = l;
  }
  let r = 3;

  function wiggle() {
    return (50 / n) * Math.random() * 0.4;
  }
  let fill = "#121212";
</script>

<svg width="100" height="100" viewBox="0 0 100 100">
  <!-- Center -->
  <circle cx={50} cy={50} {r} {fill} />
  <!-- Crosshairs -->
  {#each [1, -1] as offset}
    {#each [...l] as i}
      <circle cx={50} cy={50 + wiggle() + offset * i * (50 / n)} {r} {fill} />
      <circle
        cy={50}
        cx={50 + wiggle() + offset * i * (50 / n)}
        {r}
        fill="#121212"
      />
    {/each}
  {/each}
  <!-- Four quadrants out from center -->
  {#each [1, -1] as xoffset}
    {#each [-1, 1] as yoffset}
      <g>
        {#each l as x}
          {#each l as y}
            <circle
              cx={50 + wiggle() + xoffset * x * (50 / n)}
              cy={50 + wiggle() + yoffset * y * (50 / n)}
              {r}
            />
          {/each}
        {/each}</g
      >
    {/each}
  {/each}
  <text
    x="50"
    y="50"
    font-size="50"
    text-anchor="middle"
    dominant-baseline="middle"
    >{density.toFixed(2)}
  </text>
</svg>

<style>
  svg {
    border-radius: 7px;
    width: 55px;
    height: 55px;
    background-color: var(--light-bg);
  }
  circle {
    fill: var(--accent-fg);
  }
  text {
    fill: var(--accent-bg);
    outline: var(--accent-fg);
  }
</style>
