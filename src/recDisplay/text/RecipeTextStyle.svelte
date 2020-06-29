<div>
    <slot/>
</div>
<style>
 
 h2 {
     font-family : var(--recipeHeadFont);
     font-weight: bold;
     font-size: 1.5rem;
 }
 div {
     font-family: var(--recipeFont);
     font-size : 1rem;
     line-height: 1.4;
     max-width: 45em; /* readability... */
 }

 div :global(h1),div :global(h2),div :global(h3),div :global(h4),div :global(h5),div :global(h6) {
     margin-bottom: 3px;
     font-weight: bold;
     text-decoration: underline;
 }
 div :global(ol) {
     list-style: none;
     counter-reset: my-awesome-counter;
     padding-left: 2rem;
 }

 div :global(ol li) {
     counter-increment: my-awesome-counter;
     border-left: 1px solid var(--accent-fg);
     padding-left: 0.7em;
 }

 div :global(ol li::before) {
     content: counter(my-awesome-counter);
     background-color: var(--accent-fg);
     color: var(--accent-bg);
     font-weight: bold;
     position: absolute;
     right: 100%;
     width: 1rem;
     /* text-align: right; */
     text-align: center !important;
     margin-right: 0 !important;
     margin-left: 0 !important;
     top: 0;
     font-size: 1rem;
     border-radius: 30% 0 0 30%;
     padding: 2px;
 }

 div :global(ul) {
     padding-left: 1.5rem;
 }
 div :global(ul li::before) {
     /* Right-Facing Triangle */
     height: 0px;
     width: 0px;
     border-top: 0.25rem solid transparent;
     border-bottom: 0.25rem solid transparent;
     border-left: 0.5rem solid var(--accent-bg);
     content: " ";
     margin-right: 1em !important;
     margin-left: 0 !important; /* Overrule quill */
     position: absolute;
     left: -1rem;
     top: 0.5rem;
 }
 div :global(li) {
     position: relative;
     margin-bottom: 0.5rem;
     margin-top: 0.5rem;
     padding: 0;
 }
 div :global(ol li) {
     /* min-height: 3rem;
        display: flex;
        align-items: center; */
 }

 div :global(img),
 div :global(video) {
     max-width: 100%;
 }

</style>
    
