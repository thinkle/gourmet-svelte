/**
 * @fileOverview
 * Basic code for inserting TAGS into a chrome page. Helps us manage tags and insert them.
 * @name recipeTagger.js
 * @author Thomas M. Hinkle
 * @license GPL
 */
import Highlight from './Highlight.svelte';
import {getNodeAddress} from './nodeAddress.js';
import {tagClassname} from './metadata.js';
import {backgroundAddChild} from '../messaging/tags.js';
import {contentParseSelection,
        contentGetPageInfo,
        contentClearAll,
        contentClearMany,
        contentClearOne} from '../messaging/parsing.js';
let highlights = {}
window.highlights = highlights


var Tagger = function () {
    var markupId = 0;
    var salt = 'oiweras0';
    var delayed = []
    
    function tagElement (el, tagname, content, detail, delayHighlight=false) {
        markupId += 1;
        let nodeAddress = getNodeAddress(el)
        let id = salt + markupId
        const doHighlight = () => {
            let h = new Highlight({
                target:el.parentElement,
                anchor:el,
                props:{
                    targetNode:el,
                    targetContent:content,
                    name:tagname,
                    detail:detail,
                    //address:nodeAddress, 
                    id:id
                }
            })
            highlights[markupId] = h;
        }
        let tag = {
            id:id,
            html:content&&getHtmlFromDocumentFragment(content)||el.outerHTML,
            tag:tagname,
            text:el.innerText||el.textContent,
            fullText:el.textContent,
            detail,
            address : nodeAddress
        }
        if (!delayHighlight) {
            doHighlight();
        }
        else {
            delayed.push(doHighlight)
        }
        return tag;
        
    }

    function clearAll () {
        for (let hcomponent of Object.values(highlights)) {
            hcomponent.remove();
        }
        return true;
    }

    function clear (id) {
        if (highlights[id]) {
            highlights[id].remove();
        }
        return true;
    }

    function getHtmlFromDocumentFragment (fragment) {
        // https://stackoverflow.com/questions/36653316/get-innerhtml-of-document-fragment-instead-of-textcontent
        var html = '';
        for (let child of fragment.children) {
            html +=' ' + child.outerHTML
        }
        return html;
    }

    function markupAndGetSelection (name,detail) {
        // get the data...
        let range = window.getSelection().getRangeAt(0);
        let text = window.getSelection().toString();
        let fragment = range.extractContents();
        //let html = getHtmlFromDocumentFragment(fragment)
        // stick a span in that we can anchor our component to
        let placeholder = document.createElement('span');
        range.insertNode(placeholder)
        // create our tag
        let parsed = tagElement(placeholder,name,fragment,detail)
        // return info to pass on...
        return {
            ...parsed,
            text
            //address : getNodeAddress(placeholder)
        }
    }

    function getPageInfo () {
        return {
                url : location.href,
                host: location.hostname,
                title : document.title
        }
    }
    function listen () {
        contentParseSelection.receive((tag)=>markupAndGetSelection(tag));
        contentGetPageInfo.receive(()=>getPageInfo());
        console.log('Establish clearAll listener');
        contentClearAll.receive(
            ()=>{
                console.log('CLEAR ALL!');
                return clearAll()
            }
        );
        contentClearOne.receive((id)=>clear(id));
        contentClearMany.receive(
            (ids)=>{ids.map((id)=>clear(id));return false}
        );
    }

    function finishTagging () {
        const batchSize = 5;
        const toDo = Math.min(batchSize,delayed.length);
        for (let i=0; i<toDo; i++) {
            // let's try five tags at a time...
            let next = delayed.pop();
            next();
        }
        if (delayed.length > 0) {
            setTimeout(finishTagging,0);
        }
    }

    // Interface we expose...
    return {
        //tagClass,
        getPageInfo,
        markupAndGetSelection,
        tagElement,
        clearAll,
        clear,
        highlights,
        listen,
        finishTagging
    }
}

var tagger = Tagger();
window.tagger = tagger;
export default tagger;
