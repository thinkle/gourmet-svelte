import { tweened } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';

import scrollparent from 'scrollparent'

export function scrollIntoView (node) {
    let parent = scrollparent(node);
    let scrollTop = tweened(parent.scrollTop,{
        duration : 1000,
        easing : cubicOut
    });
    let unsubscribe = scrollTop.subscribe(
        (v)=>parent.scrollTop=v
    );
    //parent.scrollTop = (node.offsetTop - parent.clientHeight/2); // middle of parent
    scrollTop.set(node.offsetTop - parent.clientHeight/2) // middle of parent
        .then(
            unsubscribe
        );
}

