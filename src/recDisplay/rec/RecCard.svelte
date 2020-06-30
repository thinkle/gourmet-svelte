<script>
 export let rec
 export let hideCheck = false;
 export let checked=undefined
 export let onClick=undefined
 export let nocolor=false
 $: thumb = rec.images && rec.images.length > 0 && rec.images[0];
 import RecDef from '../../common/RecDef.js';
 import RecPropDisplay from '../props/RecPropDisplay.svelte';
 import {Button,Checkbox,OneLiner} from '../../widgets/'
 export let size="lg"
 import {getColor} from './colors.js';

 $: color = !nocolor && getColor(rec);


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
     md : 22px,
     lg : 28px,
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
         font-size: $fs*1.3;
         display: -webkit-box;
         -webkit-line-clamp: 3;
         -webkit-box-orient: vertical;
         overflow: hidden;
         text-overflow: ellipsis;
     }

     .#{$name} .info :global(span) {
         font-size: $fs;

     }

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
     min-width: 1px; /* https://css-tricks.com/preventing-a-grid-blowout/ */
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
     min-width: 1px;
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
     align-self: stretch;
     justify-self: center;
 }


</style>
