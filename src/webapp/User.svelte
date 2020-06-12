<script>
 import {getContext} from 'svelte';
 import api from '../data/api.js';
 import {user} from '../stores/user.js';
 import {
     Button,
     IconButton,
     JsonDebug,
     FormTask
 } from '../widgets/'
 function setFakeUser () {
     
 }

 let name
 let email
 
 let newName = $user.name

 $: if (!newName) {
     newName = $user.dbuser ? $user.dbuser.name : $user.name
 }

 let settingName
 let emailToShare
 let {doLogin,doLogout} = getContext('login')
 let linkedAccounts;
 let invites=[]
</script>

<div class="block">
    <h2>Hello {$user.dbuser && $user.dbuser.name || $user.username}</h2>

    <p>Here you can manage user settings</p>
    <IconButton icon="reload" on:click="{user.getDBUser}">Refresh</IconButton>
    <Button on:click="{doLogout}">Logout</Button> <Button on:click="{doLogin}">Login</Button>

    {#if $user && $user.dbuser && $user.dbuser.invites}
        {#if !$user.dbuser.linked}
            <h3>Accept Invite</h3>
            <div>
                You've been invited to share an account! You can accept that invitation here.
                Note that once you click this button, you will be acting as if you are that account.
                If you want to make your own private recipe collection, you'll have to disable that setting here.
            </div>
        {:else}
            <h3>Manage Linked Account</h3>
            <div>Your email is currently linked to {$user.dbuser.linked}.</div>
        {/if}
        {#if $user.dbuser.invites.length > 1}
            <h3>Wow, you're popular. You have two separate invites. You can toggle which one you're using, but you
                have to be in one account or the other...</h3>
        {/if}
        {#each $user.dbuser.invites as invite}
            {#if invite.email == $user.dbuser.linked}
                <!-- remove link -->
                <FormTask name="{`Account Linked to ${invite.name} (${invite.email})`}"
                          promiseAction="{()=>store.removeLinkedAccount(invite.email)}"
                          buttonName="Remove Link"
                />
            {:else}
                <!-- Add link -->
                <FormTask name="{`Invite from ${invite.name} (${invite.email})`}"
                          promiseAction="{()=>user.acceptLinkedAccount(invite.email)}"
                          buttonName="Link Accounts"
                />
            {/if}
        {/each}
    {/if}
    <h3>Share Account</h3>
    <div>
        Share your account? Want to make sure your domestic partner can access all your recipes on thir device without having to sign in as you? You can let them access through their own email account by adding the email here. Note, your partner will have all the same control as you to edit items, etc., so please only share with someone you trust.
    </div>
    {#if $user && $user.dbuser && $user.dbuser.linkedAccounts}
        <b>You currently share your account with:
        {#each $user.dbuser.linkedAccounts as account,n}
            <span>
                {account}{#if n<$user.dbuser.linkedAccounts.length-1},{/if}
            </span>
        {/each}</b>
        (Note: they will have to log in with that email and then accept your invitation &mdash; I don't send
        an email for you since they aren't likely to read it and might think it's spam.
        <Button on:click={()=>invites=$user.dbuser.linkedAccounts.slice()}>Edit permissions</Button>
        Invites?{invites}
        {#if invites}
            <FormTask
                promiseAction="{()=>user.setInvites(invites)}"
                buttonName="Set"
                name="Remove Linked Account"
            >
                {#each invites as invite,n (`${invite}+${n}`)}
                    <span>{invite}</span> <IconButton icon="remove" bare="true" small="true"
                                                      on:click="{()=>invites=invites.filter((i)=>invite!=i)}"
                                          />
                {/each}
            </FormTask>
        {/if}
    {/if}
    
    <FormTask
        promiseAction="{()=>user.addInvite(emailToShare)}"
        isReady="{$user.name != newName}"
        name="Share Account"
        buttonName="Share"
        icon="save"
    >
        <label>Email Address:</label>
        <input bind:value="{emailToShare}">
    </FormTask>

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

    <h3>Subscribe</h3>
    <div>
        I'm just kidding -- I'm still just getting this thing ready. But you <em>can</em> donate money to me. And eventually this service will probably require some level of subscription to pay for my server fees and such.
    </div>

    <h3>Changing Email?</h3>
    <div>
        Sorry - your email is the keys to the recipe kingdom. You can't really change it. You <em>can</em> share your account with a new email and then sign in through that email to manage your account. If for some reason it's important to you to change the root email in charge of your account, contact our support team for help.
    </div>
    
    





    Fake user:
    <br>Name: <input bind:value="{name}" >
    <br>Email: <input bind:value="{email}" >
    <button on:click="{user.fake({name,email})}">Set Fake User</button>
    
    User Data:<JsonDebug data="{$user}"/>
    
</div>

<style>
 h3 {
     margin-top: 1em;
 }
 .block {
     max-width: 30em;
     margin: auto;
 }
</style>
