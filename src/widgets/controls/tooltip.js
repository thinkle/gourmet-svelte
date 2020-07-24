import Tooltip from './Tooltip.svelte'

function tooltip (node,props) {
    if (!node) {return}
    if (!props.content) {return}
    let t;
    // For reasons I still don't understand, adding a timeout avoids a bug where
    // adding tooltips in scrolling cards in RecipeList leads to an infinite loop...
    setTimeout(
        ()=>{
            //let body = document.querySelector('body')
            t = new Tooltip({target:node,accessors:true,props});
            let ttwidth = props.width||120;


            node.addEventListener(
	        'mouseover',
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
	        'mouseout',
	        ()=>t.show=false
            )	




        },
        0
    );

    return {
        destroy () {
            if (t) {
                t.$destroy();
            }
        }
    }
    
}

export {tooltip}
