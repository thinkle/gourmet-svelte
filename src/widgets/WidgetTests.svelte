<script>
 import Tester from './Tester.svelte';
 import ipsum from '../common/mocks/ipsum.js';
 import SideBySide from './SideBySide.svelte';
 
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
</script>
<div>
    <h3>Widget Tests...</h3>
    <Tester let:option="{option}" name="Tester" options="[1,2,3,4,5,6,7]" >
        <div>
            They chose test number {option}
        </div>
    </Tester>
    <Tester name="Side by Side with all the heads"
            options={Object.keys(sideBySideOptions)}
            let:option="{choice}"
    >
        <SideBySide {...sideBySideOptions[choice]}>
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
