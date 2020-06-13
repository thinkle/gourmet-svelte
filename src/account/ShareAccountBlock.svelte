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
    Share your account? Want to make sure your domestic partner can access all your recipes on thir device without having to sign in as you? You can let them access through their own email account by adding the email here. Note, your partner will have all the same control as you to edit items, etc., so please only share with someone you trust.
</div>
{#if $user.remoteUser.dbUser.linkedAccounts} <!-- If we share our account... -->
    <b>You currently share your account with:
        <!-- Each shared account -->
        {#each $user.remoteUser.dbUser.linkedAccounts as account,n}
            <span>
                {account}{#if n<$user.remoteUser.dbUser.linkedAccounts.length-1},{/if}
            </span>
        {/each}</b>
        <Button on:click={()=>invites=$user.remoteUser.dbUser.linkedAccounts.slice()}>Edit permissions</Button>
        {#if invites}
            <!-- If we're editing invites -->
            <FormTask
                promiseAction="{()=>user.setInvites(invites)}"
                buttonName="Set"
                name="Remove Linked Account"
            >
                {#each invites as invite,n (`${invite}+${n}`)}
                    <span>{invite}</span>
                    <IconButton icon="remove" bare="true" small="true"
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
    icon="save"
>
    <label>Email Address:</label>
    <input bind:value="{emailToShare}">
</FormTask>
