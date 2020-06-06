import {writable,derived} from 'svelte/store';
import times from '../utils/times.js';
export const latestBuildTime = new writable(Number("BUILD_MS"))
export const stamp = new derived(
    latestBuildTime,
    ($bt)=>{
        let now = new Date().getTime();
        let diff = now - $bt;
        return `Build was ${times.getDescription(diff/1000)} ago`
    }
);


export function registerBuild (time,module) {
     latestBuildTime.update(
         (oldTime)=>{
             if (time > oldTime) {
                 return time
             }
             else {
                 return oldTime
             }
         }
     );
}
/* To use, add:
import {registerBuild} from 'debug.js'; registerBuild(Number("BUILD_MS"));
*/
