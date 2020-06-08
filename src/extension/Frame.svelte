<script>
 import {fly} from 'svelte/transition';
 import {onMount} from 'svelte';
 export let id;
 import IB from '../widgets/IconButton.svelte';
 import Resizer from '../widgets/Resizer.svelte';
 import ComponentSandbox from './parser/ComponentSandbox.svelte';
 let cookie = chrome.extension.getURL("images/cookie.png");
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
 $: url = port && `http://localhost:${port}/sidebar` || 'https://gourmet-svelte.netlify.app/sidebar'
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
                <ComponentSandbox>
                    <link
                        href="https://fonts.googleapis.com/css?family=Roboto:300,400,500|Material+Icons&display=swap"
                        rel="stylesheet"
                    />
                    <div class='head'>
                        <img style="margin-right: auto" width=50 src="{cookie}" alt="cookie">
                        <span style="font-weight:bold">Gourmet</span>
                        <span style="margin-left: auto">
                            <IB on:click="{minimize}" icon="chevron_right"></IB>
                            <button on:click="{()=>width+=50}">+</button>
                            <button on:click="{()=>width-=50}">-</button>
                        </span>
                    </div>
                    <input bind:value="{port}">
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
 .head {
     display: flex;
     height: 50px;
 }
 iframe {
     height: calc(100vh - 50px);
     width: var(--grmtSidebarWidth);
 }
 div :global(.resizer) {
     background-color: #77777777;
 }
</style>
