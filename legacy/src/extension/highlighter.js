import IngHighlight from '../recDisplay/text/IngHighlight.svelte';
import {parseIngredients} from '../utils/ingredientUtils.js';
import {parseTimes} from '../utils/times.js';
import {writable} from 'svelte/store';
import {contentSetIngredients,contentHighlightIng, highlightedIngredientsCB} from './messaging/highlighterMessages.js';

let highlightedIngredients = writable({
    active:[]
});
let justSet = false;
highlightedIngredientsCB.contentReceive(
    ($highlightedIngredients)=>{
        justSet = true;
        highlightedIngredients.set($highlightedIngredients)
    }
);

highlightedIngredients.subscribe(
    ($highlightedIngredients)=>{
        if (justSet) {
            console.log('Ignore our own setting event');
            justSet = false;
        } else {
            console.log('highlightedIngredients set from content side UI, update background')
            highlightedIngredientsCB.send(
                $highlightedIngredients
            );
        }
    }
);

//setContext('highlightedIngredient',{highlighted:'sugar'})


contentSetIngredients.receive(
    (ingredients)=>highlight(ingredients)
);

export async function highlight (ingredients) {
    return await crawlAndHighlight(document.body,ingredients);
}

export async function crawlAndHighlight (node,ingredients) { // async to not block...
    if (node && node.tagName && ['SCRIPT','STYLE','META','HEAD'].includes(node.tagName)) {
        return false;
    }
    if (node.children) {
        for (let child of node.children) {
            return await crawlAndHighlight(child,ingredients);
        }
    }
    if (node.innerHTML == node.innerText) {
        // leaf node...
        let parsed = parseIngredients(node.innerHTML, ingredients)
        if (parsed && parsed != node.innerHTML) {
            console.log('Replacing!');
            node.innerHTML = parsed;
            let toInsert = []
            for (let insertedNode of node.children) {
                if (insertedNode.tagName=='ING') {
                    toInsert.push(insertedNode);
                }
            }
            toInsert.forEach(
                (insertedNode)=>{
                    console.log('insert one...');
                    
                    let ih = new IngHighlight({
                        target:node,
                        anchor:insertedNode,
                        props:{
                            highlightedIngredientFromProps:highlightedIngredients,
                            target:insertedNode.getAttribute('target'),
                            content:insertedNode.textContent,
                            useStyle:true
                        }
                    });
                    insertedNode.remove();
                }
            );
        }
    }
}
