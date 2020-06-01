import {crossfade} from 'svelte/transition';

const [send, receive] = crossfade({
    duration: 200,
});
export {send}
export {receive}
