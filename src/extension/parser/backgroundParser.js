import {pollers,onConnectToPoll} from '../messaging/polling.js';
import {sendTabMessage} from '../messageSender.js';
import {backgroundParsePage,
        contentParsePage,
        backgroundGetPageInfo,
        contentGetPageInfo,
        backgroundClearOne,
        contentClearOne,
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

function respondToPoll (tabId,data) {
    console.log('poll',tabId,data,pollers);
    if (pollers[tabId]) {
        for (let poller of pollers[tabId]) {
            console.log('Send poller parsed',parsed[tabId])
            poller({parsed:parsed[tabId],
                    ...data})
        }
    }
}

onConnectToPoll((port)=>{
    console.log('backgroundParser connecting to poll',port);
    port.postMessage({parsed:parsed[port.sender.tab.id]})
    console.log('sent update',parsed,parsed[port.sender.tab.id]);
})


function addWaitingChildren (tabId, tag) {
    if (waitingChildren[tabId] && waitingChildren[tabId][tag.id]) {
        console.log('Adding waiting children!');
        tag.children = [...tag.children,...waitingChildren[tabId][tag.id]]
    }    
}

export function addTags (tabId, tags) {
    console.log('Adding tag (request from content)',tags);
    if (!parsed[tabId]) {
        parsed[tabId] = {
        }
    }
    for (let tag of tags) {
        addWaitingChildren(tabId,tag);
        parsed[tabId][tag.id]=tag;       
    }
    console.log(`Done adding ${tags.length} tags to parsed: `,parsed[tabId]);
    respondToPoll(tabId,
                  {lastRequest : {
                      action : 'addTags',
                      tags
                  }});
}

export function addTag (tabId, tag) {
    if (!parsed[tabId]) {
        parsed[tabId] = {}
    }
    addWaitingChildren(tabId,tag);
    parsed[tabId][tag.id]=tag;
    respondToPoll(
        tabId,
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
            respondToPoll(sender.tab.id);
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
            respondToPoll(sender.tab.id);
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
                respondToPoll(sender.tab.id);
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
            respondToPoll(sender.tab.id)
            return pageInfo
        },
        true // external
    );
    
    backgroundParsePage.receive(
        async (msg, sender)=>{
            console.log('parse page...',sender.tab)
            let response = await contentParsePage.send(null, sender.tab);
            addTags(sender.tab.id,response);
            respondToPoll(sender.tab.id)
            return response
        },
        true // external
    );

    backgroundClearAll.receive(
        async (msg, sender) => {
            console.log('Got clear all');
            parsed[sender.tab.id] = {}
            await contentClearAll.send(null, sender.tab);
            respondToPoll(sender.tab.id)
            return parsed[sender.tab.id];
        },
        true
    );

    backgroundClearOne.receive(
        async (id, sender) => {
            delete parsed[sender.tab.id][id];
            contentClearOne.send(id,sender.tab);
            respondToPoll(sender.tab.id)
            return parsed[sender.tab.id]
        },
        true
    )
}
