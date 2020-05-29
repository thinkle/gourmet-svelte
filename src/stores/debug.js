import {writable,derived} from 'svelte/store';
import times from '../utils/times.js';
export const latestBuildTime = new writable(BUILD_MS)
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
             console.log('Register build at...',module,time);
             if (time > oldTime) {
                 console.log('newest!')
                 return time
             }
             else {
                 console.log('newly registered build not newer than',oldTime);
                 return oldTime
             }
         }
     );
}
/* To use, add:
import {registerBuild} from 'debug.js'; registerBuild(BUILD_MS);
*/
