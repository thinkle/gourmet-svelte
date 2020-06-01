import {crossfade} from 'svelte/animate';

const [send, receive] = crossfade({
		duration: 200,
	});
export {send}
export {receive}
