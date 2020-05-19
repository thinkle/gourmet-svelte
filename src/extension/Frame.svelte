<script>
 import {fly} from 'svelte/transition';
 import {onMount} from 'svelte';
 export let id;
 import IB from '../widgets/IconButton.svelte'
 let cookie = chrome.extension.getURL("images/cookie.png");
 
 onMount(()=>{
     maximize();
 });
 let visible = true;
 
 function getRoot () {
     return document.getElementsByTagName('html')[0]||document.body
 }

 function maximize () {
     visible = true;
     getRoot().style.width = 'calc(100% - 300px)'
 }
 function minimize () {
     visible = false;
     getRoot().style.width = '100%'
 }
 let url
 let port = 59181
$: url = `http://localhost:${port}/sidebar`;// '//localhost:5000';
 
</script>
<link
    href="https://fonts.googleapis.com/css?family=Roboto:300,400,500|Material+Icons&display=swap"
    rel="stylesheet"
/>
{#if visible}
    <div class="container" transition:fly={{x:300}}>
        <div class='head'>
            <img style="margin-right: auto" width=50 src={cookie} alt="cookie">
            <h2>Gourmet</h2>
            <span style="margin-left: auto"><IB on:click={minimize}>chevron_right</IB>
        </div>
        <input bind:value={port}>
        <iframe title="Gourmet Sidebar" src={url} id="{id}">
            No frame loaded?
        </iframe>
    </div>
{:else}
    <button id='max' transition:fly={{x:300}}
            on:click = {maximize}
    >
        <img src={cookie} alt="Gourmet Extension Logo"/>
    </button>
{/if}

<style>
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
 .container {
     display: block;
     position: fixed;
     width: 300px;
     top: 0;
     right : 0;
     border-left: 5px solid purple;
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
 }
</style>
