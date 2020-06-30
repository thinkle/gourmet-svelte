import {crossfade,fade} from 'svelte/transition';

const faders = {
};

export function getCrossfade(k) {
    if (faders[k]) {
        console.log('Using crossfader',k);
        return faders[k];
    } else {
        console.log('Creating crossfader for ',k)
        faders[k] = crossfade({
            duration:600,
            fallback:fade
        });
        return faders[k]
    }
    
}

