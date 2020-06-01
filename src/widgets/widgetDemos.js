import {registerBuild} from '../stores/debug.js'; registerBuild(BUILD_MS);
import InputTests from './Inputs.demo.svelte';
import TimerTests from './Timer.demo.svelte';
import IngredientInput from './IngredientInput.demo.svelte';
import SVG from './SVGs.demo.svelte';
import MenuDemo from './Menu.demo.svelte';

 export default {
     'inputs':InputTests,
     'timers':TimerTests,
     'ingredient':IngredientInput,
     'svg':SVG,
     'menu':MenuDemo,
 }
