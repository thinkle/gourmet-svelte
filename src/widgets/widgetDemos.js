import {registerBuild} from '../stores/debug.js'; registerBuild(Number("BUILD_MS"));
import InputTests from './Inputs.demo.svelte';
import TimerTests from './Timer.demo.svelte';
import IngredientInput from './IngredientInput.demo.svelte';
import SVG from './SVGs.demo.svelte';
import MenuDemo from './Menu.demo.svelte';
import TabsDemo from './Tabs.demo.svelte';
import ButtonDemo from './Button.demo.svelte';
 export default {
     'inputs':InputTests,
     'timers':TimerTests,
     'ingredient':IngredientInput,
     'svg':SVG,
     'menu':MenuDemo,
     'tabs':TabsDemo,
     'button':ButtonDemo,
 }
