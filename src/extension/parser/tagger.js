/**
 * @fileOverview
 * Basic code for inserting TAGS into a chrome page. Helps us manage tags and insert them.
 * @name recipeTagger.js
 * @author Thomas M. Hinkle
 * @license GPL
 */
import Highlight from './Highlight.svelte';
import {tagClassname} from './metadata.js';
import {backgroundAddChild} from '../messaging/tags.js';
import {contentParseSelection,
        contentGetPageInfo,
        contentClearAll,
        contentClearOne} from '../messaging/parsing.js';
let highlights = {}
window.highlights = highlights

var Tagger = function () {
    var markupId = 0;
    var salt = 'oiweras0';
    var delayed = []
    
    function getNodePath (node, addressList) {
        // Given a node with parents, we crawl the whole document...
        // and return our position...
        if (!addressList) {addressList = []}
        var parent = node.parentElement
        if (!parent) {
            return addressList
        }
        var idx = Array.prototype.indexOf.call(parent.childNodes,node)
        if (idx===undefined) {
            addressList.push(99999);
        }
        addressList.push(idx);
        // Go up a step...
        return getNodePath(parent,addressList);
    }

    function getNodeAddress (node) {
        var path = getNodePath(node);
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
                    address:nodeAddress,
                    id:id
                }
            })
            highlights[markupId] = h;
            let children = checkForChildren(h.ref)
            lookForParent(el);
        }
        let tag = {
            id:id,
            html:content&&getHtmlFromDocumentFragment(content)||el.outerHTML,
            tag:tagname,
            text:el.textContent,
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
        
        function checkForChildren (node, children=[]) {
            if (node.children) {
                for (let child of node.children) {
                    if (child && child.classList.contains(tagClassname) && child.id != id) {
                        children.push(child.id)
                    }
                    else if (child) {
                        checkForChildren(child,children)
                    }
                }
            }
            for (let child of children) {
                backgroundAddChild.send({parent:id,child:id});
            }
            return children;
        }
        
        function lookForParent (node) {
            if (node.parentElement.classList.contains(tagClassname) && node.parentElement.id != id) {
                // Add!
                console.log('Found a parent!',node.parentElement.id)
                backgroundAddChild.send({parent:node.parentElement.id,child:id});
            }
            else if (node.parentElement && node.parentElement.parentElement) {
                lookForParent(node.parentElement);
            }
        }

    }

    function clearAll () {
        for (let hcomponent of Object.values(highlights)) {
            hcomponent.remove();
        }
        return true;
    }

    function clear (id) {
        highlights[id].remove();
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
