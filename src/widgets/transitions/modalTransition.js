import { crossfade } from 'svelte/transition';


let crossfades = {}

export function getCrossfade (name, props={duration:200}) {
    if (!crossfades[name]) {
        crossfades[name] = crossfade({
		duration: 200,
	});
    }
    return crossfades[name]
}

const [send, receive] = crossfade({
		duration: 200,
	});
export {send}
export {receive}
