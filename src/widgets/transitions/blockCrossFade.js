export function blockCrossfade ({duration=300, delay=0, easing, fallback}={}) {
    let to_receive = {}
    let to_send = {}

    function crossfade (from,node,params,out) {
	const to = node.getBoundingClientRect();
	const dx = from.left - to.left;
	var dy = from.top - to.top;
	let moveMeBack;
	let resizeMe;
	if (!out) {
	    moveMeBack = true;
	} else {
	    resizeMe = true;
	}
	const dw = from.width / to.width;
	const dh = from.height / to.height;
	const d = Math.sqrt(dx * dx + dy * dy);
	const extraHeight = from.height + to.height
	const style = getComputedStyle(node);
	const transform = style.transform === 'none' ? '' : style.transform;
	const opacity = +style.opacity;
	let widthChange = to.width - from.width;
	let heightChange = to.height - from.height;
	
	return {
	    delay,
	    duration,
	    easing,
	    css: (t, u) => {
		return `
	         opacity: ${t * opacity};
		${moveMeBack && "height: 0px;"}
		${resizeMe && false && `
		   width:${from.width+widthChange*t}px;
		   height:${from.height+heightChange*t}px;
		 `
		 }
		transform-origin: top left;				
		transform: ${transform} translate(0px,${(moveMeBack && -1*from.height || 0)}px) scale(${t + (1-t) * dw}, ${t + (1-t) * dh});
			`}
	};
    }
    
    function transition(items, counterparts, intro, out) {
	return (node, params) => {
	    items[params.key] = {
		rect: node.getBoundingClientRect()
	    };

	    return () => {

		if (counterparts[params.key]) {
		    const { rect } = counterparts[params.key];
		    delete counterparts[params.key];
		    return crossfade(rect, node, params,out);
		}

		// if the node is disappearing altogether
		// (i.e. wasn't claimed by the other list)
		// then we need to supply an outro
		delete items[params.key];
		return fallback && fallback(node, params, intro); // we won't need for this demo...
	    };
	};
    }
    
    let send = transition(to_send, to_receive, false,true);
    let receive =	transition(to_receive, to_send, true);
    return [send,receive]
}
