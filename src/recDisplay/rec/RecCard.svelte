<script>
 export let rec
 export let hideCheck = false;
 export let checked=undefined
 export let onClick=undefined
 $: thumb = rec.images && rec.images.length > 0 && rec.images[0];
 import RecDef from '../../common/RecDef.js';
 import RecPropDisplay from '../props/RecPropDisplay.svelte';
 import {Button,Checkbox,OneLiner} from '../../widgets/'
 export let size="lg"
 let color

 const wordColors = [
     // some whimsical ingredient matchers
     {matcher:/eggplant|aubergine|gh?anou/i, color: {bg:'#614051',fg:'white'}},
     {matcher:/chocolate/i, color: {bg:'#3F000F',fg:'#ffeeff'}},
     {matcher:/\bsea\b|fish|salmon|crab|lobster|squid|calamar/i, color : {bg: '#0077BE', fg:'white'}}, // - ocen blue
     {matcher:/asparagus/i, color : {bg: '#87a96b', fg:'white'}},
     {matcher:/spinach/i, color: {bg:'#455439',fg:'white'}},
     {matcher:/apple/i, color: {bg:'#ff0800',fg:'white'}},
     {matcher:/tomato/i, color: {bg:'#ff6347',fg:'white'}},
     
     // courses
     {matcher:/cookie|bread/i, color:{bg:'#d8ad6a',fg:'#eeeeee'}}, // beige
     {matcher:/dessert/i, color: {bg:'#FF3366',fg:'white'}}, // red/pink
     {matcher:/salad/i, color: {bg:'#55ab55',fg:'white'}}, // green

     // cuisines...
     {matcher:/pasta|italy|italian/i, color: {bg:'#ce2b37',fg:'white'}},
     {matcher:/india/i, color: {bg:'#FEB200',fg:'black'}}, // tumeric
     {matcher:/thai/i, color: {bg:'#f94b1e',fg:'white'}}, // red/orange
     {matcher:/china|chinese|asian/i, color: {bg:'#c51015',fg:'white'}}, // red/orange
     {matcher:/french|france/i, color: {bg:'#456990',fg:'white'}}, // queen blue
     {matcher:/mexic|spanish|spain/i, color: {bg:'#EB6424',fg:'white'}}, // persimmon

     
 ]

 $: color = getColor(rec);

 function getColor (recipe) {
     for (let {matcher,color} of wordColors) {
         if (recipe && recipe.title && recipe.title.match(matcher)) {
             return color
         } else if (recipe && recipe.categories && recipe.categories.find((c)=>c.name && c.name.match(matcher))) {
             return color;
         }
     }
     // generic...
     return {
         bg: '#AFD2E9',
         fg: '#121234'
     }
 }

</script>
<article
    class:xs="{size=='xs'}"
    class:sm="{size=='sm'}"
    class:md="{size=='md'}"
    class:lg="{size=='lg'}"
    class:xl="{size=='xl'}"
    class:hasImage="{!!thumb}" style="{color&&`--accent-bg: ${color.bg}; --accent-fg: ${color.fg};`}">
    <div class="topbg"></div>
    <div class="bottombg"></div>
    <h2 class:withCheck="{!thumb && !hideCheck}">
        {#each RecDef.titleProps as titleProp}
            <span
                on:click="{()=>onClick({rec,title:rec[titleProp.name],target:'title'})}"
            >{rec[titleProp.name]||titleProp.nullValueText}</span>
        {/each}
        {#if !thumb && !hideCheck}
            <div class="floatingCheck">
                <Checkbox bind:checked="{checked}" on:change color="white" />
            </div>
        {/if}
    </h2>
    {#if thumb}
        <div class='image' >
            <img src={thumb.url} alt={thumb.alt||rec.title}/>
            <!-- Forget the thumbnails for now -->
        </div>
        {#if !hideCheck}
        <div class="check">
            <Checkbox bind:checked="{checked}" on:change color="{color.fg}" />
        </div>
        {/if}
    {/if}
    <div class="info" >
        {#each RecDef.recProps.filter((p)=>p.summaryView) as prop}
            <div class="propBox">
                <OneLiner bg="var(--light-bg)" fg="var(--light-fg)">
                <RecPropDisplay 
                    clickable="{true}"
                    onClick="{onClick}"
                    prop="{prop}"
                    value="{rec[prop.name]}"
                />
                </OneLiner>
            </div>
        {/each}        
    </div>
    
    <div class="left">
        <slot name="left"/>
    </div>

    <div class="right">
        <slot name="right"/>
    </div>

</article>


<style type="text/scss">

 $sizes : (
     xs : 160px,
     sm : 200px,
     md : 300px,
     lg : 400px,
     xl : 600px,
 );

 $fonts : (
     xs : 14px,
     sm : 16px,
     md : 24px,
     lg : 36px,
     xl : 38px,
 );

 $border-radius: 5px;
 $pad : 16px;
 $smallpad : 3px;
 $bars : 36px;
 $bothbars : $bars * 2;
 $gold : 1.618;

 @each $name, $size in $sizes {
     $height : $size;
     $width: $size * $gold;
     $fs : map-get($fonts, $name);
     $body : $size - $bothbars;
     $image : $body;

     .#{$name} {
         font-size : $fs;
     }
     
     .#{$name} img {
         width: $image;
         height: $image;
         object-fit: cover;
     }
     
     article.#{$name} {
         display: inline-grid;
         grid-template-columns: 1fr 1fr 1fr;
         grid-template-rows: 36px $body/2 $body/2 36px;
         grid-template-areas:
             "title title title"
             "title title title"
             "info  info  info"
             "left right right";
         font-family: var(--recipeFont);
         width: $width;
         height: $size;
         margin : $fs;
     }

     article.hasImage.#{$name} {
         grid-template-rows: 36px $body/2 $body/2 36px;
         grid-template-columns: 1fr 1fr $body;
         grid-template-areas:
             "title title check"
             "title title image"
             "info  info  image"
             "left right right";
     }

     .#{$name} h2 span {
         font-size: $fs;
         display: -webkit-box;
         -webkit-line-clamp: 4;
         -webkit-box-orient: vertical;
         overflow: hidden;
         text-overflow: ellipsis;
     }

     .#{$name} .info :global(span) {
         font-size: $fs*0.8;

     }

     /* Overflow has pretty ellipses, but then scrolls awkwardly
      on hover so we can see data if we really want to */
     /*.#{$name} .info :global(*) {
         max-width: $width - 2 * $pad;
         text-overflow: ellipsis;
         white-space: nowrap;
     }

     .#{$name} .info :global(*):hover {
         white-space: break-spaces; 
     }
     */
     .#{$name}.hasImage .info :global(*) {
         max-width: $width - $image - $pad;
     }

     
 }
 h2 {
     font-weight: bold;
     grid-area: title;
     color: var(--accent-fg);
     padding-left: $pad;
     padding-top: $pad;
     padding-bottom: $smallpad;
     padding-right: $smallpad;
 }
 .topbg {
     background-color: var(--accent-bg);
     color: var(--accent-fg);
     border-radius: $border-radius $border-radius 0 0;
     width: 100%;
     height: 100%;
     width: 100%;
     height: 100%;
     grid-row-start: 1;
     grid-row-end: 3;
     grid-column-start: 1;
     grid-column-end: 4;
 }
 .bottombg {
     background-color: var(--light-bg);
     color: var(--light-fg);
     border-radius: 0 0 $border-radius $border-radius;
     width: 100%;
     height: 100%;
     width: 100%;
     height: 100%;
     grid-row-start: 3;
     grid-row-end: 5;
     grid-column-start: 1;
     grid-column-end: 4;
 }


 .info {
     grid-area: info;
     padding-left: $pad;
     padding-right: $pad;
     padding-top : $smallpad;
     padding-bottom : $smallpad;
     display: flex;
     flex-direction: column;
     border-bottom: 1px solid var(--light-underline);
 }
 .propBox {
     flex: 1
 }
 /* .propBox {
    flex: 1;
    overflow-y: scroll;
    } */

 .title {
     grid-area: title;
 }
 .left {
     grid-area: left;
     align-self: center;
     justify-self: start;
     padding-left: $pad;
 }
 .right {
     grid-area: right;
     align-self: center;
     justify-self: end;
     padding-right: $pad;
 }
 .check {
     grid-area: check;
     align-self: end;
     justify-self: end;
     padding-right: $pad;
 }

 h2.withCheck {
     display: flex;
     flex-direction: row;
 }

 .floatingCheck {
     margin-left: auto;
     padding-right: $pad;
     padding-left: $pad;
 }

 p {
     margin-bottom: 0.5 * $pad;
 }
 
 .image {
     margin-right: $pad;
     border-radius: 50%;
     overflow: hidden;
     grid-area: image;
     align-self: center;
     justify-self: center;
 }


</style>
