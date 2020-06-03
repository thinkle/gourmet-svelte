<script>
 export let name;
 export let parsed;
 export let tags;

 import IconButton from '../../widgets/IconButton.svelte';
 import JsonDebug from '../../widgets/JsonDebug.svelte';
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
    {#if show}
        <IconButton icon="chevron_up"
            on:click="{()=>show=false}"
        >
            hide
        </IconButton>
        {#each Object.keys(rules) as ruleKey}
            {#if rules[ruleKey] && rules[ruleKey][0] && rules[ruleKey][0].rule && rules[ruleKey][0].rule.selector}
                <li>
                    <strong>
                        {rules[ruleKey][0].rule.selector}: {rules[ruleKey].length}
                    </strong>
                    <IconButton icon="delete" on:click="{()=>removeRule(ruleKey)}">Remove rule</IconButton>
                    {#each rules[ruleKey] as parsedItem,n}
                        <div class='popup'>
                            {@html parsedItem.html}
                        </div><IconButton icon="close" bare="true" on:click="{()=>removeItem(parsedItem)}"/>
                        {#if n < rules[ruleKey].length - 1}
                            ,
                        {/if}
                    {/each}
                </li>
            {:else}
                <div>
                    What's up with {ruleKey} => <JsonDebug data={rules[ruleKey]}/>
                </div>
            {/if}
        {/each}
    {:else}
        <IconButton icon="info" bare="true"
                    on:click="{()=>show=true}"
        />
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
