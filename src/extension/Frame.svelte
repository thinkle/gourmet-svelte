<script>
 import {fly} from 'svelte/transition';
 import {onMount} from 'svelte';
 export let id;
 import {Bar,Button,IconButton,Resizer} from '../widgets/';
 import ComponentSandbox from './parser/ComponentSandbox.svelte';
 let cookie
 try {
     cookie = chrome.extension.getURL("images/cookie.png");
 }
 catch (err) {
     console.log('No extension cookie? Maybe we are testing');
     cookie = '/favicon.png'
 }
 let width = 300;
 let resizeWidth = '5px'; /* Hard-coded in CSS below */
 onMount(()=>{
     maximize();
 });
 let visible = true;
 
 function getRoot () {
     return document.getElementsByTagName('html')[0]||document.body
 }

 function maximize () {
     visible = true;
     getRoot().style.width = `calc(100% - ${width}px)`
 }

 $: visible && maximize(width)
 
 function minimize () {
     visible = false;
     getRoot().style.width = '100%'
 }
 let url
 let port
 $: url = port && `http://localhost:${port}/sidebar` || 'https://www.gourmetrecipemanager.com/sidebar'
 let startWidth
 let inputShield;
</script>
<link
    href="https://fonts.googleapis.com/css?family=Roboto:300,400,500|Material+Icons&display=swap"
    rel="stylesheet"
/>
{#if visible}


    <div class="container" style={`--grmtSidebarWidth:${width}px`} transition:fly={{x:300}}>
        <div class="lr">
            <Resizer
                width="{resizeWidth}"
                onStart="{()=>{startWidth=width;inputShield=true}}"
                onDrag="{(dx)=>{width=startWidth+dx}}"
                onFinish="{()=>{inputShield=false}}"
            />
            <div>
                <ComponentSandbox fullWidth="{true}">
                    <link
                        href="https://fonts.googleapis.com/css?family=Roboto:300,400,500|Material+Icons&display=swap"
                        rel="stylesheet"
                    />
                    <Bar>
                        <span slot="left" ><img style="margin-right: auto" width=50 src="{cookie}" alt="cookie"></span>
                        <span slot="center" ><b>Gourmet</b></span>
                        <span slot="right" >
                            <Button bare="{true}" on:click="{()=>width+=50}">+</Button>
                            <Button bare="{true}" on:click="{()=>width-=50}">-</Button>
                            <IconButton bare="{true} small={true}" on:click="{minimize}" icon="chevron_right"></IconButton>
                        </span>
                    </Bar>
                    <!-- <input bind:value="{port}"> -->
                </ComponentSandbox>
                <div>
                    <div class:inputShield></div>
                    <iframe title="Gourmet Sidebar" src={url} id="{id}">
                        No frame loaded?
                    </iframe>
                </div>
            </div>
        </div>
    </div>
{:else}
    <button id='max' transition:fly={{x:300}}
            on:click = {maximize}
    >
        <img src={cookie} alt="Gourmet Extension Logo"/>
    </button>
{/if}

<style>
 .inputShield {
     width: var(--grmtSidebarWidth);
     height: 100vh;
     position: absolute;
     top: 0;
     left : 0;
     background-color: #11111188;
 }
 #max {
     position: fixed;
     top: 15px;
     right: 15px;
     z-index: 9999999999999999;
     background-color: transparent;
     border: none;
     width: 50px;
     heigth: 50px;
     display: block;
 }
 #max img {
     width: 100%;
     display: inline-block;
 }

 .lr {
     display: flex;
 }
 
 .container {
     display: block;
     position: fixed;
     width: 300px;
     width: calc(var(--grmtSidebarWidth) + 5px);
     top: 0;
     right : 0;
     z-index: 9999999999999999;
     background-color: white;
     height: 100vh;
 }
 iframe {
     height: calc(100vh - 50px);
     width: var(--grmtSidebarWidth);
 }
 div :global(.resizer) {
     background-color: #77777777;
 }
 b {
     font-family: var(--recipeFont);
 }
</style>
