<script>
 export let name;
 export let parsed;
 export let tags;

 import {IconButton,
         Modal,
         ModalLauncher,
         JsonDebug} from '../../widgets/';
 import {backgroundClearOne,backgroundClearMany} from '../messaging/parsing.js';

 let rules, items;
 let show;

 $: {
     rules = {
     };
     items =[];
     Object.values(parsed).forEach(
         (p)=>{
             if (p.tag==name) {
                 items.push(p);
                 let key = JSON.stringify(p.rule)
                 if (!rules[key]) {
                     rules[key] = [p]
                 } else {
                     rules[key].push(p);
                 }
             }
         }
     );
     rules = rules;
     items = items;
 }

 async function removeItem (item) {
     let result = await backgroundClearOne.send(item.id)
     console.log('Removed item',item,'result:',result);
 }

 async function removeRule (ruleKey) {
     // In the future, we should tell the background to remove the rule set...
     for (let item of rules[ruleKey]) {
         console.log('Removing ...',item.id)
         await backgroundClearMany.send(rules[ruleKey].map((item)=>item.id));
         console.log('Remove next...')
     }
 }
 
</script>

<!-- Per tag view for editing mark-up... -->
<span>
    {tags[name]} already tagged
    <ModalLauncher modalVisible="{show}" key="tagEdit">
        <IconButton icon="info" bare="true"
                    on:click="{()=>show=true}"
        />
    </ModalLauncher>
    {#if show}
        <Modal onClose={()=>show=false} key="tagEdit">
            {#each Object.keys(rules) as ruleKey}
                {#if rules[ruleKey] && rules[ruleKey][0]}
                    <li>
                        {#if rules[ruleKey][0].rule && rules[ruleKey][0].rule.selector}
                            <strong>
                                {rules[ruleKey][0].rule.selector}: {rules[ruleKey].length}
                            </strong>
                            <IconButton icon="delete" on:click="{()=>removeRule(ruleKey)}">Remove rule</IconButton>
                        {/if}
                        <ul>
                            {#each rules[ruleKey] as parsedItem,n}
                                <li>
                                    <div class='popup'>
                                        {@html parsedItem.html}
                                    </div>
                                    <IconButton icon="close" bare="true" on:click="{()=>removeItem(parsedItem)}"/>
                                </li>
                            {/each}
                        </ul>
                    </li>
                {:else}
                    {console.log('Empty rule: ',ruleKey,rules[ruleKey])}
            {/if}
        {/each}
        </Modal>
    {/if}
</span>

<style>
 .popup {
     max-width: 100px;
     max-height: 40px;
     overflow: hidden;
     margin: 0;
     padding: 0;
     display: inline-block;
     border: 1px dotted grey;
 }
 .popup:hover {
     max-height: 100px;
     overflow-x: scroll;
     overflow-y: scroll;
     
 }
</style>
