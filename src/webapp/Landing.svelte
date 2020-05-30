<script>
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

{#if isLoggedIn}    
    <nav>
        <div>Hello, {username}
            <slot name="leftnav"/>
        </div>
        <div class='brand'>Gourmet</div>
        <div>
            <slot name="rightnav"/>
            <button on:click={() => doLogout()}>Log Out</button>
        </div>
    </nav>
    <slot/>
{:else}
    <nav>
        <div>Not Logged in...</div>
        <div class='brand'>Gourmet</div>
        <div></div>
    </nav>
    <article>
        <button on:click={() => doLogin() }>Log In</button>
        <button on:click={() => doSignup() }>Sign Up</button>
    </article>
{/if}


<style>
 article {
     display: flex;
     align-items: center;
     justify-content: center;
     height: calc(100vh - var(--navHeight));
 }

 article button {
     font-size : var(--large);
     margin: var(--large);
 }
 
 nav {
     height : var(--navHeight);
     display: flex;
     font-size: var(--small);
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
