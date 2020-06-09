<script>
 import { tick } from 'svelte';
 import { fly,slide,fade } from 'svelte/transition';
 import { flip } from 'svelte/animate';
 import { quintOut } from 'svelte/easing';
 import {IconButton} from '../index.js';
 export let value;
 export let onSelect
 
 let lastValue = '';
 export let options=[]
 let menu=[]
 let matches=[]
 let lastKey = undefined
 let doMagic
 const TAB = 9;
 const RET = 13;
 let currentMatch = -1;
 let haveMatches
 let justMatched = false;
 let showMenu = false;
 let showAll

 const TYPING = 1
 const MENU = 2

 let mode = TYPING
 $: {
     if (!showMenu) {
         currentMatch = -1
     }
 }
 
 function toggleMenu () {
     if (showMenu && showAll) {
         showMenu = false;
         showAll = false;
     }
     else if (showMenu && !showAll) {
         showAll = true;
     }
     else {
         showMenu = true;
         showAll = true;
     }
     inputRef.focus();
     mode = MENU
 }
 
 function doSelect (v) {
     console.log('do select!',v);
     value = v;
     showMenu = false;
     showAll = false;
     justMatched = true;
     if (onSelect) {
         onSelect(v);
     }
 }



 function updateMatches () {
     matches = options.filter((m)=>m.toLowerCase().indexOf(value.toLowerCase())>-1);
     if (showAll) {
         let otherOptions = options.filter((o)=>matches.indexOf(o)==-1);
         menu = [...matches,...otherOptions]
     }
     /* haveMatches = matches.length > 0;
      * if (!haveMatches) {
      *     currentMatch = -1;
      * }
      * else if (value) {
      *     showMenu = true;
      * }
      * if (currentMatch >= matches.length) {
      *     currentMatch = matches.length - 1;
      * }
      * if (matches.indexOf(value)>-1) {
      *     // perfect match!
      *     showMenu = false;
      * } */
 }
 
 $: {
     if (value) {
         console.log('Check it!')
         matches = options.filter((m)=>m.toLowerCase().indexOf(value.toLowerCase())>-1);
         if (showAll) {
             let otherOptions = options.filter((o)=>matches.indexOf(o)==-1);
             matches = [...matches,...otherOptions]
         }
     }
 }

 /* function updateOptions () {
  *     matches=options.filter((m)=>m.toLowerCase().indexOf(value.toLowerCase())>-1);
  *     if (!justMatched && matches.length > 0) {
  *         showMenu = true;
  *     }
  * } */
 
 function highlight (m) {
     return m.replace(new RegExp(`(${value})`,'i'),`<u>$1</u>`)
 }
 

 function onKeydown (event) {
     console.log('onKeydown...',mode==TYPING&&'Typing mode'||'Menu mode');
     // RETURN means select, regardless of mode...
     if (event.keyCode==13) {
         event.preventDefault();
         if (showMenu && currentMatch > -1 && matches.length > currentMatch) {
             value = matches[currentMatch]
         }
         setTimeout(
             ()=>{
                 doSelect(value)
                 console.log('set show menu to false!');
                 showMenu = false;
                 currentMatch = -1;
                 updateMatches(); setTimeout(updateMatches,50)
             },10); // one tick...
         return 
     }
     console.log('update matches...');
     updateMatches(); setTimeout(updateMatches,50)
     if (mode==MENU) {
         // in menu mode... toggle up and down the whole menu...
         if (event.keyCode==9 && event.shiftKey || event.keyCode==38) {
             // up
             currentMatch -= 1;
             event.preventDefault()
         }
         else if (event.keyCode==9 || event.keyCode==40) {
             //down
             showMenu = true;
             event.preventDefault()
             currentMatch += 1;
         }
         if (currentMatch >= menu.length || currentMatch < 0 || event.keyCode==27) {
             console.log('switch back to typing... :(')
             showMenu = false;
             currentMatch = -1
             mode = TYPING
         }
     }
     else if (mode==TYPING) {
         
         if (event.keyCode==40 || event.keyCode==38) {
             showMenu = true;
             mode = MENU
             event.preventDefault();
             console.log("Typing arrow... set match to 0")
             currentMatch = 0;
         }
         else if (event.target.value && event.keyCode==9 && event.shiftKey) {
             if (!showMenu) {return}
             currentMatch -= 1;
             console.log("Typing shift tab... set match ",currentMatch)
             if (currentMatch > -1) {
                 event.preventDefault()
             }
             /* else if (matches) {
              *     //currentMatch = matches.length - 1
              *     //console.log("Typing shift tab... set match to last one",currentMatch)
              *     //event.preventDefault()
              *     
              * } */
             else {
                 showMenu = false;
                 console.log('Typing and shift-tab but no matches... -- allow default')
             }
         }
         else if (event.keyCode==9) {
             if (!showMenu) {return}
             // regular tab...
             currentMatch += 1;
             console.log('Typing and tab to match',currentMatch)
             if (currentMatch >= matches.length) {
                 console.log('Over the edge... hide the menu');
                 showMenu = false;
             }
             else {
                 console.log('Prevent default!');
                 event.preventDefault();
             }
         }
         else if (event.keyCode==27) {
             console.log('Escape: hide menu');
             showMenu = false;
         }
         else {
             console.log("Some other key - Let's deal with this in 10ms...")
             setTimeout(
                 ()=>{
                     // Ok -- otherwise we have changed the value...
                     console.log('Typed something... update in a sec',event.target.value);
                     if (!showMenu) {
                         if (event.target.value && matches.length) {
                             showMenu = true;
                             currentMatch = 0;
                         }
                     }
                     else {
                         if (!event.target.value) {
                             showMenu = false;
                             currentMatch = -1
                         }
                     }
                 },
                 10
             )
         }
     }
     else {
         console.log('What mode are we in?');
     }
 }

 function onKeydownOld (event) {
     //value = event.target.value;
     updateMatches();
     setTimeout(updateMatches,5) // update in a sec...
     if (event.keyCode==13) {
         if (currentMatch !== undefined) {
             value = matches[currentMatch]
             haveMatches = false;             
             lastValue = event.target.value;
         }
         event.preventDefault();
         doSelect(value);
     }
     else if (event.keyCode==27) {
         // ESCAPE
         showMenu = false;
         justMatched = true;
     }
     else if (event.keyCode==9) {
         // TAB
         if (showMenu) {
             console.log('Already have matches: add one to current');
             if (isNaN(currentMatch)) {
                 currentMatch = 0;
             }
             if (event.shiftKey) {
                 currentMatch -= 1;
             }
             else {
                 currentMatch += 1;
             }
             if (currentMatch >= matches.length) {
                 showMenu = false;
             }
             if (currentMatch < 0) {
                 showMenu = false;
             }
             if (showMenu) {
                 console.log('prevent default')
                 event.preventDefault();
             }
         }
     }
     else {
         
         console.log('key',event.keyCode)
         lastKey = event.keyCode
         if (value != lastValue) {
             justMatched = false;
             if (matches.length) {
                 currentMatch = 0;
             }
             else {
                 currentMatch = -1
             }
             lastValue = value;
         }
         if (!value) {
             console.log('No value, no menu');
             showMenu = false;
         }
     }
 }


 let focused
 let inputRef
 
 function checkFocus () {
     focused = (inputRef==document.activeElement) 
 }
 
</script>
<span class='cmb'>
    <input on:blur="{checkFocus}" on:focus="{checkFocus}" bind:this={inputRef} on:keydown={onKeydown} bind:value={value}/>
    <IconButton class="icon" on:click={toggleMenu}
                       icon={showMenu&&focused&&"arrow_drop_up"||"arrow_drop_down"}
                small={true}
                bare={true}
    />
    {#if showMenu}
        <ul transition:slide>            
            {#each matches as match,i (match)}
                <li key={match} class:current={currentMatch==i}
                    on:click={()=>doSelect(match)}
                    transition:fly
		    animate:flip={{delay: 250, duration: 250, easing: quintOut}}>{@html highlight(match,value)}</li>
            {/each}
            {#if showAll}
                {#each options as option}
                    {#if matches.indexOf(option)==-1}
                        <li transition:fly
                            on:click={()=>doSelect(option)}
                                     class:match="{value.indexOf(option)>-1}">{option}</li>
                    {/if}
                {/each}
            {/if}
        </ul>
    {/if}
</span>
<style>
 .cmb {
     position: relative;
     display: inline-flex;
 }
 .current,li:active {
     background-color: yellow;
     font-weight: bold;
 }
 li:hover {
     background-color: #ffff88;
     font-weight: bold;
 }

 li {
     transition: all 300ms;
     padding: 8px;
     border-top: 1px solid #ccc;
 }
 ul {
     padding-left: 0px;
     width: 100%;
     position: absolute;
     top : 17px;
     background-color: white;
     z-index: 999;
 }
</style>
