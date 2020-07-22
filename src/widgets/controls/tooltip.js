import Tooltip from './Tooltip.svelte'

function tooltip (node,props) {
    if (!props.content) {return}
    let nodePosition = getComputedStyle(node).position;
    let body = document.querySelector('body')
    let t = new Tooltip({target:body,accessors:true,props});
    let ttwidth = props.width||120;
    
    node.addEventListener(
	'mouseenter',
	()=>{			
	    let {top,bottom,left,right,width,height} = node.getBoundingClientRect() ;
	    // vertical component...
	    let bottomRoom = window.innerHeight - bottom;
	    if (bottomRoom < top) {
		t.y = top
		t.vertical = 'top';
	    } else {
		t.y = bottom;
		t.vertical='bottom';
	    }				
	    //horizontal component
	    
	    let rightRoom = window.innerWidth - right;		
	    let spillOver = (ttwidth - width) / 2;
	    console.log({rightRoom,bottomRoom,ttwidth,spillOver})


	    if (spillOver < left
		&&
		spillOver < rightRoom
	       ) {
		t.horizontal = 'center';
		t.x = (left+right)/2;
	    } else if (rightRoom > left) {
		t.horizontal = 'right';
		t.x = left;
	    } else {
		t.horizontal = 'left';
		t.x = right;
	    }		
	    t.show=true			
	}
    );
    node.addEventListener(
	'mouseleave',
	()=>t.show=false
    )	
}

export {tooltip}
