import Parser from './parser/recipeParser.js';
import tagger from './parser/tagger.js';
const parser = Parser(tagger);
import {
    //hello,
    reportSelection
} from './messaging/uiMessages.js';
// console.log('Set up hello listener?');
// hello.contentReceive(
//     (msg)=>{
//         console.log('Got message from content!',msg);
//     }
// );

// hello.onPortConnect(
//     ()=>{
//         console.log("hello connected! Let's send a message on every click");
//         document.addEventListener(
//             'click',
//             (event)=>{
//                 console.log('User clicked, send it along...');
//                 hello.send({event:'click',x:event.clientX,y:event.clientY})
//             }
//         );
//     }
// );

// This call opens the port
reportSelection.contentReceive(
    (msg)=>{
        //console.log('Why is background telling US about selections anyway?',msg)
    }
);
reportSelection.onPortConnect(
    ()=>{
        //console.log('CONTENT got onPortConnect for selection');
        document.addEventListener(
            'selectionchange',
            ()=>{
                let textSelected = !document.getSelection().isCollapsed
                reportSelection.send(textSelected);
            }
        );
    }
);


console.log('Extension last built at BUILD_TIME')

// chrome.extension.onMessage.addListener(
//     (msg,sender,sendResponse) => {
//         if (tagger.listenForParseMessage(msg,sender,sendResponse)) {
//             console.log('tagger handled message')
//         }
//         else if (parser.listenForParseMessage(msg,sender,sendResponse)) {
//             console.log('parser handled message');
//         }
//         else {
//             console.log('Got some other message');
//             console.log('UNHANDLED MESSAGE',msg);
//         }

//     });
tagger.listen();
parser.listen();

function testParser () {
    parser.maybe_add('.detail__header--text','title');
    parser.maybe_add('h2.document-header__title','title');
    parser.maybe_add('h2[name=title]','title');
    parser.maybe_add('.ingredients','ingredients');
    parser.maybe_add('.ingredients h5','inggroup');
    parser.maybe_add('.recipe__ingredient--header','inggroup');
    parser.maybe_add('.recipe__ingredient--quantity','amount');
    parser.maybe_add('.recipe__ingredient--detail','ingredient');
    parser.maybe_add('div.long','footnote');
    parser.maybe_add('section.asides','modifications');
    parser.maybe_add('section.recipe-instructions','instructions');
    parser.maybe_add('.recipe-instructions__yield','yield');
    parser.maybe_add('.serves','yield');
    parser.maybe_add('.recipe__yield','yield');
    parser.maybe_add('#recipe_intro .detail__content','headnote');
    parser.maybe_add('#recipe_intro .detail__content','headnote');
    parser.maybe_add('.recipe__instructions--content','instructions');
    parser.maybe_add('.asides','footnote');
}
