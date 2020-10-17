<script>
 export let onClose

 import {getContext} from 'svelte';
 import api from '../data/api.js';
 import {user} from '../stores/userStore.js';
 import {
     Button,
     IconButton,
     JsonDebug,
     FormTask
 } from '../widgets/'

 import NewUserAgreement from './NewUserAgreement.svelte';
 import ShareAccountBlock from './ShareAccountBlock.svelte';
 import InvitedBlock from './InvitedBlock.svelte';

 let name
 let email

 let newName

 let settingName
 let emailToShare
 let {doLogin,doLogout} = getContext('login')
 let linkedAccounts;
 let invites=undefined
</script>

<div class="block">
    <h2>Hello {$user && $user.remoteUser && $user.remoteUser.name || $user && $user.username}</h2>
    <p>Here you can manage user settings</p>

    <!-- If Remote User exists -->
    {#if ($user && $user.remoteUser && $user.remoteUser.dbUser)}
        <!-- This block ensures we have a dbUser to play with -->
        <!-- New User Agreement -->
        {#if $user.remoteUser.dbUser.newUser}
            <section>
                <NewUserAgreement onDone="{onClose}" />
            </section>
        {:else}
            <!-- Not a new user -->
            <!-- If invites -->
            <InvitedBlock invites="{$user.remoteUser.dbUser.invites}"/>
            {#if !$user.remoteUser.dbUser.linked}
                <ShareAccountBlock/>
            {/if}

            <h3>Subscribe</h3>
            <div>
                There are no subscriptions required or available yet, but eventually this service will probably require some level of subscription to pay for my server fees. You <em>can</em> <a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=WK4V83SNX38AJ" target="_blank"><b>donate</b></a> money to me to support ongoing development.</div>

            <h3>Change Name</h3>
            <div>Your user name isn't really used for anything, but go ahead and change it if it makes you happy!
            </div>
            <FormTask
                promiseAction="{()=>user.setName(newName)}"
                isReady="{$user.name != newName}"
                name="Change Name"
                buttonName="Save"
                icon="save"
            >
                <label>Name:</label>
                <input bind:value="{newName}">
            </FormTask>

            <h3>Changing Email?</h3>
            <div>
                Sorry - your email is the keys to the recipe kingdom. You can't really change it. You <em>can</em> share your account with a new email and then sign in through that email to manage your account. If for some reason it's important to you to change the root email in charge of your account, contact our support team for help.
            </div>
        {/if}
    {:else}
        <section>
            Hmm... we don't seem to have your user info. <br>If you've already logged in and you keep seeing this message, just try <a on:click="{()=>window.location.reload()}">refreshing the page</a> as that usually does the trick.
        <FormTask icon="refresh" promiseAction="{user.getRemoteUser}" inline="true"/>
        <Button on:click="{doLogout}">Logout</Button> <Button on:click="{doLogin}">Login</Button>
        </section>
    {/if}

    <!-- spacer. stuff to be removed -->
    <!-- <div style="height:5em"></div>
         Fake user (local dev mode only):
         <br>Name: <input bind:value="{name}" >
         <br>Email: <input bind:value="{email}" >
         <button on:click="{user.fake({name,email})}">Set Fake User</button>
         
         User Data:<JsonDebug data="{$user}"/> -->
</div>

<style>
 div :global(h2) {
     font-size: 2rem;
     font-weight: bold;
     font-family: var(--uiFont);
     text-decoration: none;
 }
 div :global(h3) {
     margin-top: 1em;
     margin-bottom: 0;
     font-weight: bold;
     font-size: 1.5rem;
     font-family: var(--uiFont);
     text-decoration: none;
 }
 section {
     border: 1px solid #aaa;
     padding: 1rem;
 }
 .block {
     max-width: 30em;
     margin: auto;
     font-family: var(--recipeFont);
     font-size: 1rem;
     line-height: 1.6;
 }
 
 div :global(p),:global(h2),:global(h3) {
     margin-bottom: 1rem;
 }
</style>
