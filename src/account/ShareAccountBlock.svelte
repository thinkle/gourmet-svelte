<script>
 import {user} from '../stores/userStore.js';
 import {
     Button,
     IconButton,
     JsonDebug,
     FormTask
 } from '../widgets/'

 let emailToShare
 let invites
</script>

<h3>Share Account</h3>
<div>
    Want to make sure your domestic partner can access all your recipes on their device without having to sign in as you?
    You can let them access through their own email account by adding the email here.
    The account you share with will have all the same control as you over your recipe collection,
    so please only share with someone you trust.
</div>
{#if $user.remoteUser.dbUser.linkedAccounts} <!-- If we share our account... -->
    <b>You currently share your account with:
        <!-- Each shared account -->
        {#each $user.remoteUser.dbUser.linkedAccounts as account,n}
            <span>
                {account}{#if n<$user.remoteUser.dbUser.linkedAccounts.length-1},{/if}
            </span>
        {/each}</b>
        <IconButton
            icon="edit"
            bare="true"
            on:click={()=>invites=$user.remoteUser.dbUser.linkedAccounts.slice()}/>
        {#if invites}
            <!-- If we're editing invites -->
            <FormTask
                promiseAction="{()=>user.setInvites(invites)}"
                buttonName=""
                name="Remove Linked Account"
            >
                {#each invites as invite,n (`${invite}+${n}`)}
                    <span>{invite}</span>
                    <IconButton icon="person_remove" bare="true" small="true"
                                on:click="{()=>invites=invites.filter((i)=>invite!=i)}"
                    />
                {/each}
            </FormTask>
        {/if} <!-- End invite editor -->
{/if} <!-- end share account section --> 
<FormTask
    promiseAction="{()=>user.addInvite(emailToShare)}"
    isReady="{emailToShare}"
    name="Share Account"
    buttonName="Share"
    icon="person_add"
>
    <label>Email Address:</label>
    <input bind:value="{emailToShare}">
</FormTask>
