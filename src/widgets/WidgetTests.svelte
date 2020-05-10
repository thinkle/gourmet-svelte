<script>
 export let initialShow
 import Tester from './Tester.svelte';
 import ipsum from '../common/mocks/ipsum.js';
 import SideBySide from './SideBySide.svelte';
 import RichText from './RichText.svelte';
 import ComboInput from './ComboInput.svelte';
 import MultiComboInput from './MultiComboInput.svelte';
 let testStringVal = '' 
 let testArrayString = ['Apple']
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
    <Tester name="MultiCombo" initialShow={initialShow}>
        <MultiComboInput bind:value={testArrayString} options={['Apple','Almond','Anchovies','Bread','Banana','Grapes','Fruit','Sugar','Fruitcake','Dumplings']}/>
        Result: {testStringVal}
    </Tester>

    <Tester name="Combo" initialShow={initialShow}>
        <ComboInput bind:value={testStringVal} options={['Apple','Almond','Anchovies','Bread','Banana','Grapes','Fruit','Sugar','Fruitcake','Dumplings']}/>
        Result: {testStringVal}
    </Tester>
    <Tester let:option="{option}" name="Editor" options="{[1,5,10,25]}" initialShow={initialShow}>
        <RichText initialValue={ipsum.generateParagraphs(option)}/>
    </Tester>
    <Tester let:option="{option}" name="Tester" options={[1,2,3,4,5,6,7]} initialShow={initialShow}>
        <div>
            They chose test number {option}
        </div>
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
