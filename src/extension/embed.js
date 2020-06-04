// Cool beans
import Frame from './Frame.svelte';

console.log('Embed that magic?');
let id = 'asdofiase098as09r8a0seriasdfjalsdfjasdfa'
if (document.getElementById(id)) {
    console.log('Already there!');
} else {
    const frame = new Frame(
        {
            target : document.body || document.querySelector('div'),
            props:{id:id},
            intro:true        
        }
    )
}

