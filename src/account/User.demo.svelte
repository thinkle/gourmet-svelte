<script>
 import u,{newUser,sharingUser} from '../common/mocks/user.js';
 import {user} from '../stores/userStore.js';
 import User from './User.svelte';
 import {setContext} from 'svelte';

 setContext('login',
            {
                doLogin () {
                    console.log('login!');
                    user.fake(u)
                },
                doSignup () {
                },
                doLogout () {
                    console.log('logout!');
                    user.logout();
                }
 });

</script>

<div>
    <User/>
</div>
<div>
    <button on:click="{
                      ()=>user.fake(u)
                      }">
        Default User
    </button>

    <button on:click="{
                      ()=>user.fake(newUser)
                      }">
        New User
    </button>
    <button on:click="{
                      ()=>user.fake(sharingUser)
                      }">
        Sharing User
    </button>
</div>
