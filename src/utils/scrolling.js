import { tweened } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';

import scrollparent from 'scrollparent'

export function scrollIntoView (node) {
    let extraOffset = 0;
    let scrollParent = scrollparent(node);
    // We now use getBoundingClientRect to handle scrolling -- that way we can handle
    // relative positioning, CSS transforms, etc.
    let nodeRect = node.getBoundingClientRect();
    let parentRect = scrollParent.getBoundingClientRect();
    let targetY = parentRect.y + parentRect.height/2 - nodeRect.height/2    
    let deltaY = (nodeRect.y - targetY);
    let scrollTop = tweened(scrollParent.scrollTop,{
        duration : 1000,
        easing : cubicOut
    });
    let unsubscribe = scrollTop.subscribe(
        (v)=>scrollParent.scrollTop=v
    );
    scrollTop.set(scrollParent.scrollTop + deltaY) // middle of parent
        .then(
            unsubscribe
        );
    return true;
}

