<script>
 import Button from './Button.svelte';
 import IconButton from './IconButton.svelte';
 let active
 let b;
 let clickCount = 0
 let bare
 let small=true
</script>

<Button {bare} {small} toggle="true" toggled="{bare}" on:click="{()=>bare=!bare}">Bare?</Button>
<Button {bare} {small} toggle="true" toggled="{small}" on:click="{()=>small=!small}">Small?</Button>

<Button {bare} {small} on:click="{()=>clickCount+=1}">This is a Plain Button</Button>
<Button {bare} {small} on:click="{()=>clickCount+=1}">This is a small Button</Button>
<Button {bare} {small} toggle="true" toggled="{active}" on:click="{()=>active=!active}">This is a toggle Button</Button>
<Button {bare} {small} inverse="true" toggle="true" toggled="{active}" on:click="{()=>active=!active}">Inverse Toggle Button</Button>
<Button {bare} {small} inverse="true" on:click="{()=>active=!active}">Inverse Button</Button>
<IconButton {bare} {small} icon="chevron_right" on:click="{()=>clickCount+=1}">This is a Plain IconButton</IconButton>
<IconButton {bare} {small} icon="save" on:click="{()=>clickCount+=1}">This is a small IconButton</IconButton>
<IconButton {bare} {small} icon="cloud" toggle="true" toggled="{active}" on:click="{()=>active=!active}">This is a toggle lefty IconButton</IconButton>
<IconButton {bare} {small} left="true" icon="chevron_right" on:click="{()=>clickCount+=1}">This is a Plain lefty IconButton</IconButton>
<IconButton {bare} {small} left="true" icon="save" on:click="{()=>clickCount+=1}">This is a lefty small IconButton</IconButton>
<IconButton {bare} {small} left="true" icon="cloud" toggle="true" toggled="{active}" on:click="{()=>active=!active}">This is a lefty toggle IconButton</IconButton>
<IconButton {bare} {small} icon="close" inverse="true" toggle="true" toggled="{active}" on:click="{()=>active=!active}">Inverse Toggle IconButton</IconButton>
<IconButton {bare} {small} icon="cloud" inverse="true" on:click="{()=>active=!active}">Inverse IconButton</IconButton>

<p>You have clicked {clickCount} times</p>
<style>
    p {font-family: var(--uiFont);}
 
</style>

