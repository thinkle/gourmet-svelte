import {crossfade,fade} from 'svelte/transition';

const faders = {
};

export function getCrossfade(k) {
    if (faders[k]) {
        return faders[k];
    } else {
        faders[k] = crossfade({
            duration:600,
            fallback:fade
        });
        return faders[k]
    }
    
}

