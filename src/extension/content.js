import Parser from './parser/recipeParser.js';
import tagger from './parser/tagger.js';
const parser = Parser(tagger);

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
