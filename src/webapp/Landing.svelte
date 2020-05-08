<script>
 import RecipeList from './recDisplay/RecipeList.svelte';
 import Admin from './Admin.svelte';
 import netlifyIdentity from 'netlify-identity-widget'
 import { user, redirectURL } from '../stores/user.js'
 import remoteApi from '../data/remoteApi.js'
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
     handleLogin();
 }

 function doSignup () {
     netlifyIdentity.open('signup');
     handleLogin();
 }

 function handleLogin () {
     netlifyIdentity.on('login',
                        u => {
                            user.login(u);
                            netlifyIdentity.close();
                            if ($redirectURL !== '') {
                                console.log('Got redirect: ',$redirectURL);
                            }
     });
 }

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

</script>
<div>
    {#if isLoggedIn}
        Howdy {username} 
        <div>
            <button on:click={() => doLogout()}>Log Out</button>
        </div>
        <button on:click={()=>adminMode=!adminMode}>
            {#if adminMode}
                Regular Mode
                {:else}
                Admin Mode
            {/if}
        </button>
        
        
    {:else}
        Not Logged in...
        <div>
            <button on:click={() => doLogin() }>Log In</button>
            <button on:click={() => doSignup() }>Sign Up</button>
        </div>
    {/if}
    {#if adminMode}
        <Admin/>
        {:else}
        <RecipeList/>
    {/if}
</div>
