<script>
 import {Button,
         Modal,
         ModalLauncher,
         Lorem} from '../';

 let open=true;
 let closeOnClickOutside=false;
</script>
<Button
    toggle="true"
    toggled="{closeOnClickOutside}"
    on:click="{()=>closeOnClickOutside=!closeOnClickOutside}"
>Close on Click Outside
</Button>
<p><Lorem inline="true" chars="{22}"/>
    <ModalLauncher modalVisible="{open}"><button on:click="{()=>open=true}">Open</button></ModalLauncher></p>
{#if open}
    <Modal
        {closeOnClickOutside}
        width="600px"
        onClose="{()=>open=false}">
        <h3><Lorem inline="true" chars="30"/></h3>
        <div>
            <Lorem graphs="{30}"/>
        </div>
    </Modal>
{/if}
<Lorem graphs="{50}"/>


<style>
 h3 {font-size: 3rem;}
</style>
