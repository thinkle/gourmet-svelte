<script>
 export let invites
 import {user} from '../stores/userStore.js';
 import {
     Button,
     IconButton,
     JsonDebug,
     FormTask
 } from '../widgets/'

</script>


{#if invites}
    {#if !$user.remoteUser.dbUser.linked}
        <!-- Not yet linked... -->
        <h3>Accept Invite</h3>
        <div>
            You've been invited to share an account! You can accept that invitation here.
            Note that once you click this button, you will be acting as if you are that account.
            If you want to make your own private recipe collection, you'll have to disable that setting here.
        </div>
    {:else}
        <!-- Linked -->
        <h3>Manage Linked Account</h3>
        <div>Your email is currently linked to {$user.remoteUser.dbUser.linked}.</div>
        <!-- End if invites -->
    {/if}
    {#if invites.length > 1}
        <!-- If more than one invite -->
        <h3>Wow, you're popular. You have two separate invites. You can toggle which one you're using, but you
            have to be in one account or the other...</h3>
    {/if}
    <!-- Each invite can be accepted or removed -->
    {#each invites as invite}
        {#if invite.email == $user.remoteUser.dbUser.linked}
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
    {/each} <!-- End each invite -->
{/if} <!-- End if invites -->
