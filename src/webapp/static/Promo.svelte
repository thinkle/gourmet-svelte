<script>
 import {WhiskLogo} from '../../widgets/'
 let sizes = ["sm","lg","marquee"]
 import Notebook from './Notebook.svelte';
 import Scissors from './Scissors.svelte';
</script>
<article>
    {#each sizes as size}
        <h2>{size} Promo Tile</h2>
        <section class="{size}">
            <div class="whisk" ><WhiskLogo size="6em"/></div>
            <div class="main">
                <h1><img src="/images/cookie.png">
                    <span>Gourmet</span>                    
                </h1>
                <h2>Web Edition</h2>
            </div>
            <footer>
                <blockquote>
                    Keep all your favorite recipes together,
                    <br>no matter where they come from,
                    <br>no matter what device you use.
                </blockquote>
                <div class="graphics">
                    <div class="scissors svg">
                        <Scissors/>
                    </div>
                    <div class="notebook svg">
                        <Notebook/>
                    </div>
                </div>
            </footer>
        </section>
        <div class="spacer"></div>
    {/each}
</article>
<style>
 .spacer {
     height: 3em;
 }
 article {
     overflow-y: scroll;
     height: 100vh;
     width: 100vw;
 }
 section {
     box-sizing: border-box;
     position: relative;
     background: linear-gradient(130deg, var(--accent-bg) 0%, black 200%);
     color: var(--accent-fg);
     padding: 1rem;
     display: flex;
     align-items: center;
     justify-content: center;
     flex-direction: column;
 }
 .sm {
     width: 440px;
     height: 280px;
 }
 .lg {
     width: 920px;
     height: 680px;
     font-size: 2rem;
 }

 .marquee {
     width: 1400px;
     height: 560px;
     font-size: 3rem;
 }

 h1 {
     font-size: 4em;
     display: flex;
     margin: auto;
     font-family: var(--recipeFont);
 }

 
 h1 img {
     width: 1em;
     align-self: center;
     justify-self: center;
 }
 
 h1 *:first-child {
     margin-left: auto;
 }
 h1 *:last-child {
     display: inline-block;
     margin-right: auto;     
 }
 h1 span {
     color: #f6e091
 }

 div {
     position: relative;
 }

 div h2 {
     position: absolute;
     right: 0;
     bottom: -.5em;
     font-size: 1.25em;
 }

 section {
     position: relative;
 }
 section > .svg {
     position: absolute;
 }
 .scissors {
     top: -0.7em;
     right: 0;
     transform: rotateZ(154deg);
 }
 .notebook {
     bottom: 0;
     left: 0;
     position: absolute;
 }
 .whisk {
     position: absolute;
     right: 0;
     top: 0;
 }
 .notebook :global(svg) {
     width: 3em;
     height: 3em;
 }

 .scissors :global(svg) {
     width: 2em;
     height: 2em;
 }
 .notebook :global(path) {
     stroke: #f6e091;
     fill: #fff0b1;
 }
 .scissors :global(path) {
     fill: #ddd;
 }

 footer {
     position: relative;
     bottom: 0;
     height: 3em;
     display: flex;
     margin-top: auto;
     margin-bottom: 0.5em;
     width: 100%;
 }
 footer .graphics {
     margin-left: auto;
     width: 4em;
 }
 footer blockquote {
     color: #f6e091;
     font-style: italic;
     margin-left: auto;
 }
 
 .main {
     margin-top: auto;
     margin-bottom: auto;
 }
</style>
