<script>
 import Tester from '../widgets/Tester.svelte'
 import netlifyIdentity from 'netlify-identity-widget'
 import { user, redirectURL } from '../stores/user.js'
 import remoteApi from '../data/remoteApi.js'

 let apiResponse
 netlifyIdentity.init();

 $: isLoggedIn = !!$user
 $: username = $user !== null ? $user.username : ' there!'

 function throwError () {
     apiResponse = remoteApi.doFetch(
         'throwError',
         $user,
         {foo:'bar',boo:7}
     );
 }

 function doBadModeRequest () {
     apiResponse = remoteApi.doFetch(
         'nonexistentmode',
         $user,
         {some:'options','because':'why not?'}
     )
 }

 function setup () {
     apiResponse = remoteApi.doFetch(
         'setup',
         $user,
         {action:'has_access'}
     );
 }


 function testApi () {
     console.log('test the api');
     apiResponse = remoteApi.doFetch(
         'echo',
         $user,
         {message:'hello world'}
     )
     /* apiResponse = fetch(url, {
      *     headers: {
      *         Accept: "application/json",
      *         "Content-Type": "application/json",
      *         Authorization: "Bearer " + ($user && $user.access_token), // like this
      *     },
      * }) */
     console.log('apiResponse is now a promise?',apiResponse);
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
<Tester name="Test Remote API">
    {#if isLoggedIn}
        Howdy {username} (JSON.stringify({$user}))
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
    <button on:click="{setup}">Setup DB</button>
    <button on:click="{throwError}">Throw Error</button>
    <button on:click="{doBadModeRequest}">Bad Mode</button>
    <div>
        {#await apiResponse}
            Fetching data from with access token {$user && $user.access_token}
        {:then json}
            Yippee got a response:
            {JSON.stringify(json)}
        {:catch error}
            Bummer... error fetching text {error}
            STATUS {error.status}
            ERR {JSON.stringify(error.error)}
            RESULT {JSON.stringify(error.result)}
        {/await}
    </div>
</Tester>
