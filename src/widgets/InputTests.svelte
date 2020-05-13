<script>
 export let initialShow
 import ipsum from '../common/mocks/ipsum.js';
 import Tester from './Tester.svelte';
 import AmountInput from './AmountInput.svelte';
 import FancyInput from './PlainInput.svelte';
 import ComboInput from './ComboInput.svelte';
 import MultiComboInput from './MultiComboInput.svelte';
 import RichText from './RichText.svelte';
 let testStringVal = '' 
 let testArrayString = ['Apple']
 let amt = 4.66667
 let amt2 = 2.5
 
 let widths = [150,200,300]
 let fontSizes = [10,12,14,18]
 let fivalue = 'initial fancy input value'

</script>
<Tester name="Input Tests" initialShow="{initialShow}" >
    <Tester name="Fancy Input"  initialShow="{initialShow}">
        {#each widths as w}
            <div style={`width:${w}px`}>
                <h2>Width: ${w}</h2>
                {#each fontSizes as size}
                    <span style={`font-size:${size}pt`}>
                        {size}pt: 
                        Unlinked: <FancyInput />
                        Linked :<FancyInput bind:value={fivalue} />
                    </span>
                {/each}
            </div>
        {/each}
    </Tester>
    <Tester name="Amount Input" initialShow="{initialShow}">
        <div>With plus/minus: <AmountInput bind:value={amt} showPlusMinusButtons="true"/> {amt}</div>
        <div>W/o plus/minus: <AmountInput bind:value={amt2}/> {amt2}</div>
        <div>Linked second amount widget:
            <AmountInput bind:value={amt2}/> {amt2}</div>
            
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
    <Tester name="MultiCombo" initialShow={initialShow}>
        <MultiComboInput bind:value={testArrayString} options={['Apple','Almond','Anchovies','Bread','Banana','Grapes','Fruit','Sugar','Fruitcake','Dumplings']}/>
        Result: {testStringVal}
    </Tester>

</Tester>
