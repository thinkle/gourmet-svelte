<script>
 import {registerBuild} from '../stores/debugStore.js'; registerBuild(Number("BUILD_MS"));
 export let scrolls
 import {
     Button,
     IconButton,
     JsonDebug,
     ModalLauncher,
     Modal,
     FullScreen,
     StatusIcon,
     Bar,
 } from '../widgets/';
 import {setContext,onMount} from 'svelte';
 import netlifyIdentity from 'netlify-identity-widget';
 import { user, redirectURL } from '../stores/userStore.js';
 import remoteApi from '../data/remoteApi.js';
 import User from '../account/User.svelte';

 let adminMode = false;


 $: isLoggedIn = !!$user;
 // || window.location.host.indexOf('localhost')>-1
 $: username = $user !== null ? $user.username : ' there!'

 let netlifyStarted = false

 onMount(
     ()=>{
         console.log('Landing onMount!')
         if (!netlifyStarted) {
             console.log('Netlify init!')
             //debugger;
             //netlifyIdentity.init()
         }
     }
 );

 function doLogout () {
     user.logout()
     netlifyIdentity.logout();
 }

 async function doLogin () {
     netlifyIdentity.open('login');
 }

 async function doSignup () {
     netlifyIdentity.open('signup');
 }


 netlifyIdentity.on('login',
                    u => {
                        //console.log('Logged in',u);
                        user.login(u);
                        netlifyIdentity.close();
                        if ($redirectURL !== '') {
                            console.log('Got redirect: ',$redirectURL);
                            location.reload();
                        } else {
                        }
 });
 netlifyIdentity.on('init',
                    u=>{
                        console.log('Init done!',u)
                        debugger;                        
                        if (u) {user.login(u);}
                        netlifyIdentity.close();
                        netlifyStarted = true;
 })
 
 
 netlifyIdentity.on('init', user => console.log('init', user));
 netlifyIdentity.on('login', user => console.log('login', user));
 netlifyIdentity.on('logout', () => console.log('Logged out'));
 netlifyIdentity.on('error', err => console.error('Error', err));
 netlifyIdentity.on('open', () => console.log('Widget opened'));
 netlifyIdentity.on('close', () => console.log('Widget closed'));

 if (window.location.host.indexOf('localhost')>-1) {
     console.log('Fake login...');
     user.login({
         email : 'tmhinkle@gmail.com',
         user_metadata : {
             full_name : 'Thomas Hinkle',
         },
         token : {
             expires_at : new Date().getTime()+60*1000*60*3,
             token_type : 'bearer',
             access_token : 'fake-access-token-yadyadyadyadya'
         }
     });
 }


 setContext(
     'login',
     {
         doLogin,
         doSignup,
         doLogout,
     }
 );

 let extraItems = []
 let hide;
 setContext('toolbar',
            {
                addItem (item) {
                    extraItems = [...extraItems,item];
                    return {
                        unmount () {
                            extraItems.splice(extraItems.indexOf(item),1);
                            extraItems = extraItems;
                        },
                        hide () {
                            item.hide = true;
                            extraItems = extraItems;
                        },
                        show () {
                            item.hide = false;
                            extraItems = extraItems;
                        },
                        hideModal () {
                            item.modalVisible = false
                            extraItems = extraItems;
                        },
                        showModal () {
                            item.modalVisible = true
                            extraItems = extraItems;
                        },
                        update (props) {
                            Object.assign(
                                item,
                                props
                            );
                            extraItems = extraItems;
                        }
                    }
                },
                hideWhenLoggedIn () {
                    hide = true
                },
                showWhenLoggedIn () {
                    hide = false
                }
            }
 );
 console.log('set toolbar context');

 let showUserSettings = false;
 $: showUserSettings = ($user && $user.remoteUser && $user.remoteUser.dbUser && $user.remoteUser.dbUser.newUser)||showUserSettings

 $: $user && !$user.remoteUser && checkForNetlifyToken()
 
 function checkForNetlifyToken () {
     console.log('Check for token?')
     if (!netlifyStarted) {netlifyIdentity.init();}
 }

</script>
<FullScreen {scrolls} header={false}>    
    <div slot="footer">
        <Bar>
            <nav slot="left">
                {#if $user && $user.remoteUser && $user.remoteUser.dbUser}
                    <StatusIcon icon="done" tooltipAbove="true" tooltip={true}>
                        Online & Signed Up!
                    </StatusIcon>
                {:else if $user && $user.remoteUser}
                    <StatusIcon icon="offline_bolt" tooltipAbove="true" tooltip={true}>
                        Logged in, but not linked to an account.
                        <Button on:click="{()=>user.getRemoteUser()}">Try fetching user info.</Button>
                    </StatusIcon>
                {:else}
                    <StatusIcon icon="offline_bolt" tooltipAbove="true" tooltip={true}>
                        Not logged in remotely
                        <button on:click="{checkForNetlifyToken}">Check</button>
                        <button on:click="{()=>user.getRemoteUser()}">Get Remote</button>
                        <button on:click="{doLogin}">Re-Login</button>
                    </StatusIcon>
                {/if}
                {#if $user}
                    <ModalLauncher key="user" modalVisible="{showUserSettings}">
                        <Button bare="true" on:click="{()=>showUserSettings=true}">
                            Account Settings
                        </Button>
                    </ModalLauncher>
                {/if}
                <slot name="leftnav"/>
            </nav>
            <nav slot='center' class='brand'>Gourmet</nav>
            <nav slot="right">
                {#if isLoggedIn}
                    {#each extraItems as item (item)}
                        <!-- Fix me if we add another one...
                             modal launcher key should be in toolbaritem, not hard-coded here
                        -->
                        <ModalLauncher
                            key="{item.key}"
                            modalVisible="{item.modalVisible}"
                        >
                            {#if !item.hide}
                                {#if item.component}
                                    <svelte:component this="{item.component}"
                                                      {...item.props}
                                    >
                                        {item.content}  {JSON.stringify(item.props)}
                                    </svelte:component>
                                {:else if item.props.icon}
                                    <IconButton {...item.props} on:click={item.onClick}>
                                        {item.content}
                                    </IconButton>
                                {:else}
                                    <span {...item.props} on:click="{item.onClick}">
                                        {item.content}
                                    </span>
                                {/if}
                            {/if}
                        </ModalLauncher>
                    {/each}
                    <IconButton bare="true" on:click={() => doLogout()} icon="close">Log Out</IconButton>
                {/if}
            </nav> <!-- end right -->
        </Bar>
    </div>
    <div class="slot" slot="main" >
        {#if isLoggedIn}
            <slot/>
        {:else}
            <article>
                <IconButton on:click={() => doLogin()} icon="login">Log In</IconButton>
                <IconButton on:click={() => doSignup()} icon="account_box">Sign Up</IconButton>
            </article>
        {/if}
    </div>
</FullScreen>
{#if showUserSettings}
    <Modal key="user" onClose="{()=>showUserSettings=false}">
        <User/>
    </Modal>
{/if}

<style>
 .hide {
     display: none;
 }
 article {
     display: flex;
     align-items: center;
     justify-content: center;
     height: calc(100vh - var(--navHeight));
 }

 article :global(button) {
     font-size : var(--large);
     margin: var(--large);
 }
 
 nav {
     height : var(--navHeight);
     display: flex;
     align-items: center;
     font-size: var(--small);
 }
 nav div {
     display: flex;
 }
 nav div:first-child {
     margin-right: auto;
 }
 nav div:last-child {
     margin-left: auto;
 }
 
 .brand {
     font-family: var(--brandFont);
 }
 
</style>
