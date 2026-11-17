<script>
 import FullScreen from './FullScreen.svelte';
 import FullHeight from './FullHeight.svelte';
 import Bar from './Bar.svelte';
 import {Lorem,Button,Tabs,Tab} from '../'
 const footer = {
     left : [1],
     center : [1],
     right : [1],
 }
 const header = {
     left : [1],
     center : [1],
     right : [1],
 }
</script>

<FullScreen scrolls={false}>
    <div slot="header">
        <Bar>
            <span slot="left">
                {#each header.left as one}
                    <Lorem chars="8" inline="true"/>
                {/each}
            </span>
            <h3 slot="center">
                {#each header.center as one}
                    <Lorem chars="8" inline="true"/>
                {/each}
            </h3>
            <span slot="right">
                {#each header.right as one}
                    <Lorem chars="8" inline="true"/>
                {/each}
            </span>
        </Bar>
    </div>
    <div slot="main" class="slot">
        <Lorem graphs="2" />
        <Tabs sticky="{true}">
            <Tab>
                <span on:click="{()=>header.left = [1,...header.left]}">Add item top left</span>
            </Tab>
            <Tab>
                <span on:click="{()=>header.center = [1,...header.center]}">Add item top center</span>
            </Tab>
            <Tab>
                <span on:click="{()=>header.right = [1,...header.right]}">Add item top right</span>
            </Tab>
        </Tabs>
        <h3>And below us a full height container...</h3>
        <FullHeight scrolls={true}>
            <p>There are some tabs above me for an example UI, but actually they're buttons.</p>
            <Lorem graphs="40" />
        </FullHeight>
    </div>
    <div slot="footer">
        <Bar>
            <span slot="left">
                {#each footer.left as one}
                    <Lorem chars="24" inline="true"/>
                {/each}
            </span>
            <h3 slot="center">
                {#each footer.left as one}
                    <Lorem chars="24" inline="true"/>
                {/each}
            </h3>
            <span slot="right">
                {#each footer.left as one}
                    <Lorem chars="24" inline="true"/>
                {/each}
            </span>
        </Bar>
    </div>

</FullScreen>
    
