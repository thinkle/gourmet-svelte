<script>
 import {registerBuild} from '../../stores/debugStore.js'; registerBuild(Number("BUILD_MS"));
 export let size=300;
 import { draw,fade } from 'svelte/transition';
 let show = false;
 import {onMount} from 'svelte'
 onMount(()=>setTimeout(() => show =  true, 100))
 let duration = 2000;
 let step = 300;
 let handleStart = 500;
 let whiskStart = 0;
 let whiskStep = 150;
 function restart () {
     console.log('restart');
     show = false;
     setTimeout(
         ()=>show=true,
         500
     )
 }
</script>
{#if show}
    <div on:click={restart} style="{`width:${size}px;height;${size}px`}">
        <svg out:fade viewBox="0 0 300 300" width={size} height={size}>
            <path
                in:draw={{delay:handleStart,duration}}
                out:fade
                class="handleTop"
                d="m 93.420234,107.70963 c -0.759616,-7.840327 -0.40266,-12.041094 2.01651,-13.983905 2.14971,-1.726414 5.442836,-1.91235 9.680996,-1.958233 0.30573,0.537137 0.57569,1.055137 0.8105,1.555083 3.6862,7.848405 -1.28955,11.247555 -12.508006,14.387055 z"
                id="path1119"
                sodipodi:nodetypes="cscsc" />
            <path
                in:draw={{delay:handleStart+step,duration}}
                sodipodi:nodetypes="cccsccc"
                id="path1062"
                d="m 92.746317,109.19566 v 0 L 17.849291,27.648902 c 0,0 6.29975,-17.8492912 16.099361,-12.249514 9.799611,5.599778 70.697188,74.197054 70.697188,74.197054 -9.255844,2.726774 -15.0733,8.03234 -12.792378,19.411688 v 0"
                class="handle" />
            <path
                in:draw={{delay:handleStart+step*3,duration}}
                sodipodi:nodetypes="ccc"
                id="path1067"
                d="M 18.313339,24.871493 C -4.8522666,18.591282 29.445849,-3.5865651 30.563477,13.735004 22.731231,15.104125 21.140748,20.374349 18.313339,24.871493 Z"
                class="hanger"
            />
            <path        
                in:draw={{delay:handleStart+step*2,duration}}
                d="m 20.023056,21.340713 c -12.3838656,-3.43314 5.951216,-15.556881 6.548677,-6.087874 -4.18696,0.748445 -5.0372,3.629465 -6.548677,6.087874 z"
                id="path1067-7"
                class="hanger"
                sodipodi:nodetypes="ccc" />

            <path
                in:draw={{delay:handleStart+step*4,duration}}
                id="path1097"
                d="m 29.62877,21.71065 c 62.241072,66.752613 61.861553,66.36676 61.861553,66.36676 v 0"
                class="darkShadow"/>
            <path
                in:draw={{delay:handleStart+step*4,duration}}
                id="path1099"
                d="M 23.280582,28.508835 L 86.191123,94.349022"
                class="lightShadow"
            />
            
            
            <path
                in:draw={{delay:whiskStart,duration}}
                d="m 95.962968,102.61276 50.280442,89.63127 c 0,0 78.14556,95.05599 88.78012,26.62436 C 246.09239,147.64205 99.606691,98.568251 99.606691,98.568251 l -2.584402,2.081599 C 115.09387,153.27682 250.58692,284.37535 244.64029,219.79127 237.79247,171.90417 100.09602,97.996108 100.09602,97.996108 v 0"
                id="path1016-9"
                class="whisk"
                sodipodi:nodetypes="ccsccccc" />
            <path
                in:draw={{delay:whiskStart+whiskStep*1,duration}}
                class="whisk"
                sodipodi:nodetypes="ccc"
                id="path1043"
                d="M 101.49597,99.396053 C 316.07398,257.61152 231.68828,297.94931 97.646122,101.84596 h -1.74993"
            />
            <path
                in:draw={{delay:whiskStart+whiskStep*2,duration}}
                class="whisk"        
                d="m 98.472521,101.70417 c 240.308809,172.68998 90.119459,213.51505 -3.849848,2.44991 h -1.74993"
                id="path1043-3"
                sodipodi:nodetypes="ccc" />
            <path
                in:draw={{delay:whiskStart+whiskStep*3,duration}}
                sodipodi:nodetypes="cc"
                id="path1147"
                d="M 97.716449,100.75652 C 230.65021,316.7468 343.43467,218.59213 102.92799,97.716449"
                class="whisk" />
            <path
                in:draw={{delay:whiskStart+whiskStep*4,duration}}
                sodipodi:nodetypes="cc"
                id="path1147"
                d="M 97.716449,100.75652 C 250.65021,346.7468 343.43467,238.59213 102.92799,97.716449"
                class="whisk" />
            
        </svg>    
    </div>
{/if}


<style>

 .what {
     stroke-width: 4;
     stroke : green;     
 }
 .handle {
     display:inline;
     fill:none;
     stroke:#4d4743;
     /*      stroke-width:4.57023; */
     stroke-width: 2;
     stroke-linecap:round;
     stroke-linejoin:round;
     stroke-miterlimit:4;
     stroke-dasharray:none;
     stroke-opacity:1
 }

 .handleTop {
     display:inline;
     fill:none;
     stroke:#393939;
     /*stroke-width:4.57023;*/
     stroke-width: 2;
     stroke-linecap:round;
     stroke-linejoin:round;
     stroke-miterlimit:4;
     stroke-dasharray:none;
     stroke-opacity:1
 }
 .two {
     fill:none;
     stroke:#000000;
     stroke-width:0.857024px;
     stroke-linecap:butt;
     stroke-linejoin:miter;
     stroke-opacity:1
 }
 .five {
     fill:none;
     stroke:teal;
     stroke-width:5;
     stroke-linecap:butt;
     stroke-linejoin:miter;
     stroke-miterlimit:4;
     stroke-dasharray:none;
     stroke-opacity:1
 }
 .six {
     display:inline;
     fill:none;
     stroke:#000000;
     stroke-width:0.540586px;
     stroke-linecap:butt;
     stroke-linejoin:miter;
     stroke-opacity:1
 }
 .seven {
     fill:none;
     stroke:#000000;
     stroke-width:0.795456px;
     stroke-linecap:butt;
     stroke-linejoin:miter;
     stroke-opacity:1
 }
 .eight {
     fill:none;stroke:#000000;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1
 }
 .nine {
     display:inline;
     fill:none;
     stroke:#000000;
     stroke-width:1px;
     stroke-linecap:butt;
     stroke-linejoin:miter;
     stroke-opacity:1;
 }

 .ten {
     fill:#b3b3b3;
     stroke:#b3b3b3;
     stroke-width:0.976108px;
     stroke-linecap:butt;
     stroke-linejoin:miter;
     stroke-opacity:1;

 }
 .whisk {
     stroke : #d6cbc3;
     stroke-width: 0.7;
 }
 .whisk:nth-child(even) {
     stroke : #b6aba3;
 }

 .whisk:nth-child(3n) {
     stroke : #a69b93;
 }
 
 path {
     fill : none;
     stroke : #343;
     stroke-width: 0.5;
 }
 .lightShadow {
     stroke : #ccc;
     stroke-width: 3;
 }
 .darkShadow {
     fill:none;stroke:#898989;stroke-width:3.794;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1
 }
 .hanger {
     stroke : #555;
     stroke-width: 3;
 }
 

</style>

