<script>
 import RecipeList from './recDisplay/RecipeList.svelte';
 import netlifyIdentity from 'netlify-identity-widget'
 import { user, redirectURL } from '../stores/user.js'
 let apiTest
 netlifyIdentity.init();

 $: isLoggedIn = !!$user
 $: username = $user !== null ? $user.username : ' there!'
 let url = "/.netlify/functions/api?message=howdy"

 function testApi () {
     console.log('test the api');
     apiTest = fetch(url, {
         headers: {
             Accept: "application/json",
             "Content-Type": "application/json",
             Authorization: "Bearer " + ($user && $user.access_token), // like this
         },
     })
     console.log('apiTest is now a promise?',apiTest);
 }

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
    <button on:click={testApi}>Test API</button>
    <div>
        {#await apiTest}
            Fetching data from {url} with access token {user && user.access_token}
        {:then response}
            {#if response}
                {#await response.text()}
                    Fetching text...
                {:then text}
                    Yippee got a response:
                    {JSON.stringify(text)}
                {:catch error}
                    Bummer... error fetching text {JSON.stringify(error)}
                {/await}
            {/if}
        {:catch error}
            Bummer got an error
            {JSON.stringify(error)}
        {/await}
    </div>
    <RecipeList/>
</div>
