<script>
 export let initialShow
 import {Tester,
                  Status} from './';
 import SideBySide from './layout/SideBySide.svelte';
 import ipsum from '../common/mocks/ipsum.js';

 import status from '../stores/statusStore.js';

 let sideBySideOptions = {
     left : {
         growLeft:true,
         growRight:false,
         growEven:false,
     },
     right : {
         growLeft:false,
         growRight:true,
         growEven:false,

     },
     even : {
         growLeft:false,
         growRight:false,
         growEven:true,
     },
     allFalse : {
         growLeft:false,
         growRight:false,
         growEven:false,

     }
 }

 function randoStatuses () {
     for (let type of ['recipe','user','other']) {
         let id = status.createStatus('test',{type});
         console.log('Created status',id);
         setTimeout(()=>status.start(id),500+Math.random()*1000);
         setTimeout(()=>status.progress(id,20,100),1000+Math.random()*2000);
         for (let i=20; i<80; i+=20) {
             let percentage = Math.floor(i+Math.random()*20);
             let delay = i*100 + Math.random()*1000;
             console.log('set',percentage,'in',delay);
             setTimeout(()=>status.progress(id,percentage,100),
                        delay)
         }
         setTimeout(()=>status.complete(id,100,100),8000+Math.random()*10000);
     }
 }

 
</script>


<div>

    <h3>Widget Tests...</h3>
    <Tester name="Status" initialShow="{initialShow}">
        <button on:click={randoStatuses}>Kick off some random status magic</button>
        All: <Status/>
        Only "recipe" <Status type="recipe" />
        Only "user" <Status type="user" />
    </Tester>
    <Tester name="Side by Side with all the heads" initialShow={initialShow}
                  options={Object.keys(sideBySideOptions)}
            let:option="{choice}"
    >
        <SideBySide {...sideBySideOptions[choice]} >
            <div slot="leftHead" >
                Left {ipsum.short}
            </div>
            <div slot="left">
                {@html ipsum.generateParagraphs(4)}
            </div>
            <div slot="rightHead" >
                Right {ipsum.short}
            </div>
            <div slot="right" >
                {@html ipsum.generateParagraphs(8)}
            </div>
        </SideBySide>
    </Tester>
</div>
<style>
</style>
