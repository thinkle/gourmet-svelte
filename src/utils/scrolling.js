import { tweened } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';

import scrollparent from 'scrollparent'

export function scrollIntoView (node) {
    let extraOffset = 0;
    let scrollParent = scrollparent(node);
    // If node is relative positioned, we have to climb...
    if (node.offsetParent !== scrollParent) {
        while (node &&
               node.offsetParent &&
               !(node.offsetParent == scrollParent
                 || 
                 node.offsetParent.contains(scrollParent)
                )
              ) {
            extraOffset += node.offsetTop;
            node = node.offsetParent
        }
    }
    if (!node) {
        // That was weird... maybe another element will work.
        return false;
    }
    let scrollTop = tweened(scrollParent.scrollTop,{
        duration : 1000,
        easing : cubicOut
    });
    let unsubscribe = scrollTop.subscribe(
        (v)=>scrollParent.scrollTop=v
    );
    scrollTop.set(node.offsetTop+extraOffset - scrollParent.clientHeight/2) // middle of parent
        .then(
            unsubscribe
        );
    return true;
}

