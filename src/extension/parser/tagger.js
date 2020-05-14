/**
 * @fileOverview
 * Basic code for inserting TAGS into a chrome page. Helps us manage tags and insert them.
 * @name recipeTagger.js
 * @author Thomas M. Hinkle
 * @license GPL
 */
import Highlight from './Highlight.svelte';

let highlights = {}
window.highlights = highlights

var Tagger = function () {
    var markupId = 0;
    var salt = 'oiweras0';

    function getNodePath (node, addressList) {
        // Given a node with parents, we crawl the whole document...
        // and return our position...
        if (!addressList) {addressList = []}
        var parent = node.parentElement
        if (!parent) {
            console.log("Done iwth parents");
            return addressList
        }
        var idx = Array.prototype.indexOf.call(parent.childNodes,node)
        if (idx===undefined) {
            console.log('weird - not in parent?');
            addressList.push(99999);
        }
        addressList.push(idx);
        // Go up a step...
        return getNodePath(parent,addressList);
    }

    function getNodeAddress (node) {
        var path = getNodePath(node);
        console.log('Got path: %s',path);
        path.reverse();
        path = path.map(
            (i)=>{
                while ((''+i).length < 5) {
                    i = '0' + i;
                }
                return i
            });
        return path.join('-');
    }

    function tagElement (el, tagname, content, detail) {
        markupId += 1;
        let h = new Highlight({
            target:el.parentElement,
            anchor:el,
            props:{
                targetNode:el,
                targetContent:content,
                name:tagname,
                detail:detail,
                id:salt+markupId
            }
        })
        highlights[markupId] = h;
        return salt+markupId
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
        let html = getHtmlFromDocumentFragment(fragment)
        // stick a span in that we can anchor our component to
        let placeholder = document.createElement('span');
        range.insertNode(placeholder)
        // create our tag
        let id = tagElement(placeholder,name,fragment,detail)
        // return info to pass on...
        return {
            id,text,html,
            tag : name,
            address : getNodeAddress(placeholder)
        }
    }

    // Interface we expose...
    return {
        //tagClass,
        markupAndGetSelection,
        tagElement,
        listenForParseMessage : (msg,sender,sendResponse) => {
            console.log('Got message! %s',JSON.stringify(msg));
            if (msg.action=='parseSelection') {
                console.log('time to parse... %s',msg.part);
                var parsed = markupAndGetSelection(msg.part)
                var resp = {
                    id:parsed.id,
                    part:msg.part,
                    parsed:parsed
                }
                console.log('Sending response: %s',JSON.stringify(resp));
                sendResponse(resp);
            }
        },


    }
}

var tagger = Tagger();
window.tagger = tagger;
export default tagger;
