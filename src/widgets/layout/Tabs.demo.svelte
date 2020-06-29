<script>
 import Tabs from './Tabs.svelte';
 import Tab from './Tab.svelte';
 import {Lorem,Bar,Button} from '../';
 let data = [
     {key:0,label:'Hello',active:true,action:function(){}},
     {key:1,label:'World',active:false,action:function(){}},
     {key:2,label:'Also this',active:false,action:function(){}},
 ];
 let active=1
 let tabs = ['one','two','three']
 let nested=1
 let nestedData = [
     [1,2,3],
     [4,5,6],
     [7,8,9]
 ]
 let count = 9;
</script>
<p>nested tabs</p>

<Tabs>
    {#each nestedData as page,n}
        <Tab active="{active==n}" on:click="{()=>active = n}">Page #{n}</Tab>
    {/each}
</Tabs>

{#each nestedData as page,n}
    {#if n==active}
        <Bar>
            <div class="slot" slot="left">
                <Tabs>
                    {#each page as item,n}
                        <Tab active="{nested==n}" on:click="{()=>nested = n}">{page} {n}: {item}</Tab>
                    {/each}
                </Tabs>
            </div>
        </Bar>
        {#each page as subpage,nn}
            {#if nested==nn}
                <div>
                    Sub page: {n}.{nn}: {page}
                    <button on:click="{()=>{
                                      nestedData[n]=[...nestedData[n],count+1];
                                      count += 1;
                                      nested = nestedData[n].length - 1
                                      n
                                      }}">
                        Create new tab on this page
                    </button>
                    <button on:click="{()=>{
                                      nestedData[n+1]=[...nestedData[n+1],count+1];
                                      count += 1;
                                      active = n+1;
                                      nested = nestedData[n+1].length - 1
                                      }}">
                        Create new tab on next page
                    </button>
                </div>
            {/if}
        {/each}
    {/if}
{/each}
    



<p>Demo with Slots</p>
<Tabs>
    <Tab active="{active==0}" on:click="{()=>active = 0}">The active one</Tab>
    <Tab active="{active==1}" on:click="{()=>active = 1}">Not active</Tab>
    <Tab active="{active==2}" on:click="{()=>active = 2}">Not active</Tab>
</Tabs>
<button on:click="{()=>active = (active + 1) % 3}">Change Active from the outside!</button>
<Lorem/>
<hr>

Tabs w data that are STICKY!
<Tabs
    data="{data}"
    handleActive="{true}"
    sticky="{true}"
/>
<Lorem graphs="{3}" />
<Tabs nowrap="{true} " sticky="{true}" stickyTop="2.2em">
    <Tab><Lorem chars="{10}"/></Tab>
    <Tab active="true"><Lorem chars="{17}"/></Tab>
    <Tab><Lorem chars="{6}"/></Tab>
    <Tab><Lorem chars="{36}"/></Tab>
    <Tab><Lorem chars="{36}"/></Tab>
    <Tab><Lorem chars="{86}"/></Tab>
    <Tab><Lorem chars="{106}"/></Tab>
</Tabs>
<h3>Second Sticky with stickyTop and nowrap=true enforced </h3>
<Bar>
    <div slot="left" >
        <Tabs>
            {#each tabs as tab,n}
                <Tab active="{active==n}" on:click="{()=>active=n}">
                    {tab}<lorem chars="8"/>
                </Tab>
            {/each}
        </Tabs>
    </div>

    <div slot="right" >
        <Button on:click="{()=>tabs = [...tabs,'Another']}">Click to Add More</Button>  
    </div>
</Bar>
<hr/>    
Empty tabs w/ warning
<Tabs/>
<Lorem graphs={2}/>
<Tabs sticky="{true}" stickyTop="4.4em">
    <Tab><Lorem chars="{10}"/></Tab>
    <Tab active="true"><Lorem chars="{17}"/></Tab>
    <Tab active="true"><Lorem chars="{95}"/></Tab>
    <Tab><Lorem chars="{46}"/></Tab>
</Tabs>
<p>One more sticky -- this one without nowrap</p>
        <h2>Extra text for scrolling testing</h2>
<Lorem graphs="{30}"/>
