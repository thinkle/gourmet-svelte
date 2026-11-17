<script>
 import DownloadButton from './DownloadButton.svelte';
 import Button from './Button.svelte';
 import IconButton from './IconButton.svelte';
 let active
 let b;
 let clickCount = 0
 let bare
 let small=true
 let busy=false
 let auto=false

 function doFakeTask () {
     busy = busy = true;
     setTimeout(()=>busy=false,
                3000);
 }
 
</script>

<Button {bare} {small} toggle="true" toggled="{bare}" on:click="{()=>bare=!bare}">Bare?</Button>
<Button {bare} {small} toggle="true" toggled="{small}" on:click="{()=>small=!small}">Small?</Button>
<br>

<br>No text:
<IconButton {bare} {small} icon="save"/> <IconButton {bare} {small} icon="cloud"/>
<IconButton {bare} {small} on:click="{()=>active=!active}" toggle="true" toggled="{active}" icon="save"/>
<IconButton {bare} {small} toggle="{true}" toggled="{active}" on:click="{()=>active=!active}" icon="cloud"/>


<br>
<DownloadButton content="Hello World!" filename="hello.txt">
    Download Something!
</DownloadButton>
<Button {bare} {small} tt="Hello world of tooltips" toggle="true" toggled="{auto}" on:click="{()=>auto=!auto}">Auto-download?</Button>
{#if auto}<DownloadButton auto="true" hidden="true" content="Automatic World!" filename="force-download.txt"/>
{/if}

<br>
<Button tt="Hello world of tooltips" {bare} {small} on:click="{()=>clickCount+=1}">This is a Plain Button</Button>
<Button tt="Hello world of tooltips" {bare} {small} on:click="{()=>clickCount+=1}">This is a small Button</Button>
<Button tt="Hello world of tooltips" {bare} {small} toggle="true" toggled="{active}" on:click="{()=>active=!active}">This is a toggle Button</Button>
<br>
<Button tt="Hello world of tooltips" {bare} {small} inverse="true" toggle="true" toggled="{active}" on:click="{()=>active=!active}">Inverse Toggle Button</Button>
<Button tt="Hello world of tooltips" {bare} {small} inverse="true" on:click="{()=>active=!active}">Inverse Button</Button>
<IconButton {bare} {small} icon="chevron_right" on:click="{()=>clickCount+=1}">This is a Plain IconButton</IconButton>
<IconButton {bare} {small} icon="save" on:click="{()=>clickCount+=1}">This is a small IconButton</IconButton>
<br>
<IconButton {bare} {small} icon="cloud" toggle="true" toggled="{active}" on:click="{()=>active=!active}">This is a toggle lefty IconButton</IconButton>
<IconButton {bare} {small} left="true" icon="chevron_right" on:click="{()=>clickCount+=1}">This is a Plain lefty IconButton</IconButton>
<IconButton {bare} {small} left="true" icon="save" on:click="{()=>clickCount+=1}">This is a lefty small IconButton</IconButton>
<IconButton {bare} {small} left="true" icon="cloud" toggle="true" toggled="{active}" on:click="{()=>active=!active}">This is a lefty toggle IconButton</IconButton>
<br>
<IconButton {bare} {small} icon="close" inverse="true" toggle="true" toggled="{active}" on:click="{()=>active=!active}">Inverse Toggle IconButton</IconButton>
<IconButton {bare} {small} icon="cloud" inverse="true" on:click="{()=>active=!active}">Inverse IconButton</IconButton>
<br>
<Button {bare} {small} on:click="{doFakeTask}" busy="{busy}">This {#if busy}is{:else}can be{/if} a busy button</Button>
<Button {bare} {small} on:click="{doFakeTask}" disabled="{true}">This Button is Disabled</Button>
<br>
<p>You have clicked {clickCount} times</p>
<style>
    p {font-family: var(--uiFont);}
 
</style>

