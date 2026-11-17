<script>
 import status from '../../stores/statusStore.js';
 import Status from './Status.svelte';
 function randoStatuses () {
     let durations = [3000,
                      4000,8000,12000,20000,30000,8000,3000]
     for (let type of ['recipe','user','other']) {
         let id = status.createStatus('test',{type});
         let totalDuration = durations.pop();
         console.log('Created status',id);
         setTimeout(()=>status.start(id),totalDuration/12);
         setTimeout(()=>status.progress(id,
                                        {amount:20,
                                        total:100}),totalDuration/5);
         for (let i=2; i<5; i+=1) {
             let percentage = 20*i
             let delay = (totalDuration/5)*i;
             setTimeout(()=>{
                 console.log(id,`@ ${20*i}%`);
                 status.progress(id,
                                 {amount:percentage,total:100}
                 );
             },
                        delay);
         }
         setTimeout(()=>{
             console.log(id,'complete!');
             status.complete(id,{amount:100,total:100});
         },
                    totalDuration);
     }
 }
 import {Button,JsonDebug} from '../'
</script>

<Button on:click={randoStatuses}>Kick off some random status magic</Button><Status/>
<JsonDebug data="{$status}"/>

