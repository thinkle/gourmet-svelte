<script>
 import RecCard from './RecCard.svelte';
 import Color from 'color';
 import {wordColors} from './colors.js'
 import {Lorem,CategoryInput,Button,IconButton,PlainInput} from '../../widgets/'
 import RecipeTextStyle from '../text/RecipeTextStyle.svelte';
 let newfg='#efefef'
 let newbg='#232323'
 let contrast
 let rec = {title:"Hello world",
           images:[{url:"https://loremflickr.com/300/300/dinner"}],
           categories:[{name:'Amazing'},{name:'Stuff'}]
           };
 let editor


 $: try {contrast = Color(newfg).contrast(Color(newbg));} catch (err) {console.log('bad color you bad bad person')}
 
 function setScheme (wordColor) {
     newfg=wordColor.color.fg;
     newbg=wordColor.color.bg;
     editor.scrollIntoView();
 }
 let word = "chocolate"
</script>
Type magic word: <input bind:value="{word}">

<div class="cards">
    <RecCard rec="{{...rec,title:word,images:[{url:`https://loremflickr.com/300/300/${word}`}]}}"
             size="xs">
        <div slot="right" class="slot">
            Magic Word: {word}
        </div>
    </RecCard>
    {#each wordColors as wordColor,n}
        <div style="{(`--accent-bg: ${wordColor.color.bg}; --accent-fg: ${wordColor.color.fg};`||'')}">
            <RecCard rec="{{...rec,title:`${wordColor.matcher} (${wordColor.contrast.toFixed(2)})`,
                          images:[{url:`https://loremflickr.com/300/300/${wordColor.matcher.toString().match(/[/](\w+)/)[1]}`}]}
                          }"
                     size="xs" nocolor="{true}">
                <div slot="right" class="slot">
                    <a href="{`#scheme${n}`}">full scheme</a>
                    <IconButton icon="edit" on:click="{
                                      ()=>{setScheme(wordColor)}
                                      }"/>
                </div>
            </RecCard>
        </div>
    {/each}
</div>


<div style="{(`--accent-bg: ${newbg}; --accent-fg: ${newfg};`||'')}">
    <div bind:this="{editor}">
        FG:
        <input bind:value="{newfg}">
        <input type="color" bind:value="{newfg}">
    </div>
    <div>
        BG:
        <input bind:value="{newbg}">
        <input type="color" bind:value="{newbg}">
    </div>
    
    <h2
        style="{`
               border-bottom: 3px solid var(--accent-bg);
               `}"
    >You Make One? Contrast: {contrast.toFixed(2)}</h2>
    
    Categories: <CategoryInput value="{[{name:'Dessert'},{name:'Salad'}]}" options="{['Dessert','Salad','Spaghetti','Italian','Chinese'].map((v)=>({name:v}))}" />
    <Button>A Button</Button>    
    <div style="max-width:400px">
        <PlainInput placeholder="A text entry thing"/>
    </div>

    <RecipeTextStyle>
        <ul><li>An unordered list</li><li><Lorem graphs="2"/></li></ul>
        <ol><li>An ordered list</li><li><Lorem graphs="2"/></li></ol>
    </RecipeTextStyle>
    <RecCard rec="{rec}"
             size="md" nocolor="{true}"/>
</div>


{#each wordColors as wordColor,n}
    <div  style="{(`--accent-bg: ${wordColor.color.bg}; --accent-fg: ${wordColor.color.fg};`||'')}"><a id="{`scheme${n}`}"></a>
        <h2
            style="{`
                   border-bottom: 3px solid var(--accent-bg);
                   `}"
        >{wordColor.matcher} <span>{wordColor.contrast.toFixed(2)}</span>
            <IconButton icon="edit" on:click="{
                              ()=>{setScheme(wordColor)}
                              }">
                Edit Color Scheme
            </IconButton>
        </h2> 
        Categories: <CategoryInput options="{['Dessert','Salad','Spaghetti','Italian','Chinese'].map((v)=>({name:v}))}" value="{[{name:'Dessert'},{name:'Salad'}]}" /> <Button>A Button</Button>
        <RecipeTextStyle>
            <ul><li>An unordered list</li><li><Lorem graphs="2"/></li></ul>
            <ol><li>An ordered list</li><li><Lorem graphs="2"/></li></ol>
        </RecipeTextStyle>
        <RecCard rec="{rec}"
                 size="xs" nocolor="{true}"/>
        <div style="color: var(--accent-fg); background-color: var(--accent-bg);"> Regular <Lorem/></div>
        <div style="color: var(--accent-bg); background-color: var(--accent-fg);"> Inverted <Lorem/></div>
    </div>
{/each}
<style>
 h2 {
     
     font-size: 2rem;
     font-weight: bold;
     margin-bottom: 1em;
 }
 span {
     display: inline-block;
     padding: 4px;
     background-color: var(--accent-bg);
     color: var(--accent-fg);
 }
 .cards {
     display: flex;
     flex-wrap: wrap;
 }
 
</style>
