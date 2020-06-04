//import {sendToWeb,onConnectToPoll} from '../messaging/polling.js';
import {sendParsedToWeb,sendSelectionToWeb} from '../messaging/webMessages.js';
import {reportSelection} from '../messaging/uiMessages.js';
import {backgroundParsePage,
        contentParsePage,
        backgroundGetPageInfo,
        contentGetPageInfo,
        backgroundClearOne,
        contentClearOne,
        contentClearMany,
        backgroundClearMany,
        backgroundClearAll,
        contentClearAll,
       } from '../messaging/parsing.js';
import {
    backgroundRemoveTag,
    backgroundAddTag,
    backgroundAddTags,
    backgroundUpdateTag,
    backgroundAddChild
} from '../messaging/tags.js';

// runs in background tab
export const parsed = {
}
const waitingChildren = {
}

function updateSidebar (tabId) {
    sendParsedToWeb.send(tabId,parsed[tabId]);
}

sendParsedToWeb.onWebConnect(
    (tabid)=>{
        updateSidebar(tabid)
        reportSelection.backgroundReceive(
            tabid,
            (message)=>{
                sendSelectionToWeb.send(tabid,message);
            }
        );
    }
);
sendParsedToWeb.initializeSender();
sendSelectionToWeb.initializeSender();
sendSelectionToWeb.onWebConnect(
    (tabid)=>{
        // Necessary null listener...
        //console.log('Selection listener attached to web',tabid);
    }
);

function addWaitingChildren (tabId, tag) {
    if (waitingChildren[tabId] && waitingChildren[tabId][tag.id]) {
        tag.children = [...tag.children,...waitingChildren[tabId][tag.id]]
    }    
}

export function clearTags (tabId) {
    if (parsed[tabId]) {
        parsed[tabId] = {pageInfo:parsed[tabId].pageInfo}
    }
}

export function addTags (tabId, tags) {
    //console.log('Adding tag (request from content)',tags);
    if (!parsed[tabId]) {
        parsed[tabId] = {
        }
    }
    for (let tag of tags) {
        addWaitingChildren(tabId,tag);
        parsed[tabId][tag.id]=tag;       
    }
    //console.log(`Done adding ${tags.length} tags to parsed: `,parsed[tabId]);
    updateSidebar(tabId,
                  {lastRequest : { // second argument currently ignored
                      action : 'addTags',
                      tags
                  }});
}

function checkForPageChange(tabId, tag) {
    let parseInfo = parsed[tabId]
    if (!parseInfo) {return}
    if (tag.id=='pageInfo') {
        if (JSON.stringify(parseInfo.pageInfo) !== JSON.stringify(tag)) {
            console.log('Page changed: ',parseInfo.pageInfo,'++>',tag);
            console.log('Forgetting all our parse info');
            // FIX ME: this is a bit dangerous as we could lose user
            // data here if they accidentally navigate away in a tab,
            // open up again, and start fresh. The *right* solution is
            // probably to tie our import data to URLs instead of tabs
            // anyway
            parseInfo[tabId] = {}             
        }
    }
}

export function addTag (tabId, tag) {
    checkForPageChange(tabId,tag)
    if (!parsed[tabId]) {
        parsed[tabId] = {}
    }
    addWaitingChildren(tabId,tag);
    parsed[tabId][tag.id]=tag;
    updateSidebar(
        tabId,
        // Note: second argument is currently ignored, but we could refactor if we need it
        {
            lastRequest : {
                action : 'addTag',
                tag
            }
        }
    );
}

function listenForContent () {
    backgroundRemoveTag.receive(
        (id,sender)=>{
            delete parsed[sender.tab.id][id]
            updateSidebar(sender.tab.id);
            return true
        }
    );
    backgroundAddTag.receive(
        (tag,sender)=>{
            addTag(sender.tab.id,tag);
            return parsed[sender.tab.id]
        }
    );
    backgroundAddTags.receive(
        (tags,sender)=>{
            addTags(sender.tab.id,tags);
            return parsed[sender.tab.id];
        }
    );
    backgroundUpdateTag.receive(
        (tag,sender)=>{
            let oldData = parsed[sender.tab.id][tag.id]
            parsed[sender.tab.id][tag.id] = {
                ...oldData,
                ...tag,
            }
            updateSidebar(sender.tab.id);
            return parsed[sender.tab.id]
        }
    );
    backgroundAddChild.receive(
        (request,sender)=>{
            const {parent,child} = request
            let parentTag = parsed[sender.tab.id] && parsed[sender.tab.id][parent];
            if (!parentTag) {
                if (!waitingChildren[sender.tab.id]) {
                    waitingChildren[sender.tab.id] = {}
                }
                if (!waitingChildren[sender.tab.id][parent]) {
                    waitingChildren[sender.tab.id][parent] = []
                }
                waitingChildren[sender.tab.id][parent].push(child)
                // Wait...
            }
            else {
                if (!parentTag.children) {
                    parentTag.children = [];
                }
                updateSidebar(sender.tab.id);
                parentTag.children.push(child)
            }
            return parsed[sender.tab.id]||{}
        }
    );
}

export function listen () {
    listenForSidebar();
    listenForContent();
}

function listenForSidebar () {
    
    backgroundGetPageInfo.receive(
        async (msg,sender)=>{
            console.log('background page info?');
            let pageInfo = await contentGetPageInfo.send(null,sender.tab)
            console.log('Got pageInfo',pageInfo);
            pageInfo.id = 'pageInfo';            
            addTag(sender.tab.id,pageInfo);
            updateSidebar(sender.tab.id)
            return pageInfo
        },
        true // external
    );
    
    backgroundParsePage.receive(
        async (msg, sender)=>{
            console.log('PARSE PAGE...',sender.tab)
            clearTags(sender.tab.id); // clear first
            let response = await contentParsePage.send(msg, sender.tab);
            addTags(sender.tab.id,response);
            updateSidebar(sender.tab.id)
            return response
        },
        true // external
    );

    backgroundClearAll.receive(
        async (msg, sender) => {
            console.log('Got clear all');
            parsed[sender.tab.id] = {}
            await contentClearAll.send(null, sender.tab);
            updateSidebar(sender.tab.id)
            return parsed[sender.tab.id];
        },
        true
    );

    backgroundClearOne.receive(
        async (id, sender) => {
            delete parsed[sender.tab.id][id];
            contentClearOne.send(id,sender.tab);
            updateSidebar(sender.tab.id)
            return parsed[sender.tab.id]
        },
        true
    )

    backgroundClearMany.receive(
        async (ids, sender) => {
            ids.forEach((id)=>delete parsed[sender.tab.id][id]);
            contentClearMany.send(ids,sender.tab);
            updateSidebar(sender.tab.id);
            return parsed[sender.tab.id];
        },
        true
    );
}
