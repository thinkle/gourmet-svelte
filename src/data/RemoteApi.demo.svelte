<script>
 import {mostRecentRequest} from './requests/index.js';
 import RemoteRecipeTester from './RemoteRecipe.demo.svelte';
 import netlifyIdentity from 'netlify-identity-widget'
 import { user, redirectURL } from '../stores/userStore.js'
 import remoteApi from '../data/remoteApi.js'
 import api from '../data/api.js';
 import {Button,JsonDebug} from '../widgets/'

 let apiResponse
 //netlifyIdentity.init();

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

 function fakeLogin () {
     user.fake({
         name : 'Thomas Hinkle the Fake',
         email : 'tmhinkle@gmail.com'
     });
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

 function doApiTest(mode,params) {
     apiResponse = remoteApi.doFetch(mode,$user,params);
 }
 let account;
 let email;
 let name;

 function setFakeUser () {
     doApiTest('setFakeUser',
               {name,email})
 }
 
</script>

{#if isLoggedIn}
    Howdy {username} (<JsonDebug data={$user}/>)
    <div>
        <Button on:click={() => doLogout()}>Log Out</Button>
    </div>
    <Button on:click={()=>setFakeUser()}>Set Fake User</Button>
    Name: <input bind:value={name}>
    Email: <input bind:value={email}>
{:else}
    Not Logged in...
    <div>
        <Button on:click={() => doLogin() }>Log In</Button>
        <Button on:click={() => doSignup() }>Sign Up</Button>
        <Button on:click={()=>fakeLogin()}>Fake Log In</Button>
    </div>
{/if}
Account: <input bind:value="{account}">
<Button on:click="{()=>{
                  doApiTest(
                      'addLinkedAccounts',
                      {accounts:[account]}
                  )
                  }}">Add linked user</Button>
<Button on:click="{()=>{
                  doApiTest(
                      'acceptLinkedAccount',
                      {account}
                  )
                  }}">Accept linked user</Button>
<Button on:click="{()=>{apiResponse = user.markNotNew()
                  }}">Mark Not New </Button>
<RemoteRecipeTester/>
<Button on:click={testApi}>Test API</Button> 
<Button on:click={()=>apiResponse = mostRecentRequest.makeRequest({user:$user})}>Get Most Recent</Button> 
<Button on:click="{setup}">Setup DB</Button>
<Button on:click="{throwError}">Throw Error</Button>
<Button on:click="{doBadModeRequest}">Bad Mode</Button>
<hr>
<Button on:click={
                 ()=>doApiTest(
                 'getRecipes',
                 {
                 fields:['owner','title','last_modified'],
                 query: {
                 'owner.email':'tmhinkle@gmail.com'
                 },
                 limit:500})}
>Get recipes with limited fields...</Button>
<Button on:click="{()=>doApiTest('getRecipes',{query:{'owner.email':'katharine.hinkle@gmail.com'},fields:['owner','title','last_modified'],limit:500})}">Get recipes with limited fields... (Katharine)</Button>
<Button on:click={()=>api.sync($user||{email:'tmhinkle@gmail.com'})}>api.sync($user)</Button>

<div>
    {#await apiResponse}
        Fetching data from with access token {$user && $user.access_token}
    {:then json}
        Yippee got a response:
        <JsonDebug data={json}/>
    {:catch error}
        Bummer... error fetching text
        <JsonDebug data={error}/>
    {/await}
</div>

