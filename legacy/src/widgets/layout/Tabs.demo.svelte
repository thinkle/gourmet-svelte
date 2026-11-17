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
 let topActive = 1
</script>


<h2>nested tabs</h2>
<Tabs>
    {#each nestedData as page,n}
        <Tab active="{topActive==n}" on:click="{()=>topActive = n}">Page #{n+1}</Tab>
    {/each}
</Tabs>
{#each nestedData as page,n}
    {#if n==topActive}
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
                    
                    <h2>Sub page: {n}.{nn}: {page}</h2>
                    <Lorem graphs="2" />
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
                                      topActive = n+1;
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
<div class="spacer"></div>

<h3>Tabs w data that are STICKY!</h3>
<Tabs
    data="{data}"
    handleActive="{true}"
    sticky="{true}"
/>
<Lorem graphs="{3}" />
<div class="spacer"></div>
<Tabs nowrap="{true} " sticky="{true}" stickyTop="2.2em">
    <Tab><Lorem chars="{10}"/></Tab>
    <Tab active="true"><Lorem chars="{17}"/></Tab>
    <Tab><Lorem chars="{6}"/></Tab>
    <Tab><Lorem chars="{36}"/></Tab>
    <Tab><Lorem chars="{36}"/></Tab>
    <Tab><Lorem chars="{86}"/></Tab>
    <Tab><Lorem chars="{106}"/></Tab>
</Tabs>
<p>Second Sticky set of tabs with stickyTop and nowrap=true enforced </p>

<div class="spacer"></div>

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

<div class="spacer"></div>

<h3>Empty tabs w/ warning</h3>
<Tabs/>
<Lorem graphs={2}/>

<div class="spacer"></div>
<Tabs sticky="{true}" stickyTop="4.4em">
    <Tab><Lorem chars="{10}"/></Tab>
    <Tab active="true"><Lorem chars="{17}"/></Tab>
    <Tab active="true"><Lorem chars="{95}"/></Tab>
    <Tab><Lorem chars="{46}"/></Tab>
</Tabs>
<p>One more sticky -- this one without nowrap</p>
        <h2>Extra text for scrolling testing</h2>
<Lorem graphs="{30}"/>
<style>
 .spacer {
     height: 4em
 }
 h1,h2,h3,h4,h5,h6 {
     font-weight: bold;
     font-size: 1.3em;
 }

 
</style>
