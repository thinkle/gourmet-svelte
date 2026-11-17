import {highlightedIngredientsCB, sendHighlightToWeb, backgroundHighlightIng,
        contentSetIngredients,backgroundSetIngredients,
       } from './messaging/highlighterMessages.js';

// Go between between web and content...
export function initHighlighterBackground () {
    console.log('set up background script go-between for passing highlighter messages between web and content');

    backgroundSetIngredients.receive(
        (ingredients,sender)=>{
            console.log('bg pass along ingredients to content',ingredients,sender,sender.tab);
            contentSetIngredients.send(
                ingredients,
                sender.tab
            );
            return true;
        },
        true // external
    );


    sendHighlightToWeb.initializeSender();
    sendHighlightToWeb.onWebConnect(
        // When web connects to us...
        async (tabid) => {
            console.log('Connected highlighter to web: tab',tabid)
            // We pass all content messages on to the web
            highlightedIngredientsCB.backgroundReceive(
                tabid,
                (message)=>{
                    console.log('content says highlight, pass it on',message);
                    sendHighlightToWeb.send(tabid,message)
                }
            );
        }
    );


    // Also the other way...
    console.log('Set up backgroundHighlightIng receiver...')
    backgroundHighlightIng.receive(
        async (msg, sender) => {
            // pass message along...
            console.log('web says highlight, pass it on',msg,sender);
            highlightedIngredientsCB.send(msg,sender.tab.id);
            return true;
        },
        true // external
    );
    console.log('Done w/ background highlighter setup');
}
