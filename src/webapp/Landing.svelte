<script>
 import RecipeList from './recDisplay/RecipeList.svelte';
 import netlifyIdentity from 'netlify-identity-widget'
 import { user, redirectURL } from '../stores/user.js'
 import remoteApi from '../data/remoteApi.js'

 netlifyIdentity.init();

 $: isLoggedIn = !!$user
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

</script>
<div>
    {#if isLoggedIn}
        Howdy {username} 
        <div>
            <button on:click={() => doLogout()}>Log Out</button>
        </div>
    {:else}
        Not Logged in...
        <div>
            <button on:click={() => doLogin() }>Log In</button>
            <button on:click={() => doSignup() }>Sign Up</button>
        </div>
    {/if}
    <RecipeList/>
</div>
