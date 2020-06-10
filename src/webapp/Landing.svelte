<script>
 export let scrolls
 import {IconButton,
        ModalLauncher,
        FullScreen,
        Bar,
        } from '../widgets/';
 import {setContext} from 'svelte';
 import netlifyIdentity from 'netlify-identity-widget';
 import { user, redirectURL } from '../stores/user.js';
 import remoteApi from '../data/remoteApi.js';
 let adminMode = false;
 netlifyIdentity.init();

 $: isLoggedIn = !!$user;
 // || window.location.host.indexOf('localhost')>-1
 $: username = $user !== null ? $user.username : ' there!'

 function doLogout () {
     user.logout()
     netlifyIdentity.logout();
 }

 function doLogin () {
     netlifyIdentity.open('login');
 }

 function doSignup () {
     netlifyIdentity.open('signup');
 }

 netlifyIdentity.on('login',
                    u => {
                        //console.log('Logged in',u);
                        user.login(u);
                        netlifyIdentity.close();
                        if ($redirectURL !== '') {
                            console.log('Got redirect: ',$redirectURL);
                        }
                        
 });
 
 /* netlifyIdentity.on('init', user => console.log('init', user));
  * netlifyIdentity.on('login', user => console.log('login', user));
  * netlifyIdentity.on('logout', () => console.log('Logged out'));
  * netlifyIdentity.on('error', err => console.error('Error', err));
  * netlifyIdentity.on('open', () => console.log('Widget opened'));
  * netlifyIdentity.on('close', () => console.log('Widget closed')); */

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


</script>
<FullScreen {scrolls} header={false}>    
    <div slot="footer">
        <Bar>
            <nav slot="left">
                {#if isLoggedIn}Hello, {username}{/if}
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
