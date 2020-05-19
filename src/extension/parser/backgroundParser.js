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

window.parsed = parsed; // lazy


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
    port.postMessage(parsed[port.sender.tab.id])
    console.log('sent update',parsed,parsed[port.sender.tab.id]);
})


export function addTags (tabId, tags) {
    console.log('Adding tag (request from content)',tags);
    if (!parsed[tabId]) {
        parsed[tabId] = {
        }
    }
    for (let tag of tags) {
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



export function handleContentRequest (request, sender, sendResponse) {
    console.log('Got content request');
    if (request.action=='removeTag') {
        console.log('Deleting...');
        delete parsed[sender.tab.id][request.id]
        console.log(parsed);
    }
    if (request.action=='addTag') {
        addTag(sender.tab.id,request.message);
        return
    }
    if (request.action=='addTags') {
        addTags(sender.tab.id,request.message);
        // addTags handles the end stuff for us
        return
    }
    if (request.action=='addChild') {
        console.log('Request to update child');
        let parent = parsed[sender.tab.id][request.message.parent]
        if (!parent) {
            console.log('WTF? Got request to add child to nonexistent parent: ',request.message);
            throw Error('WTF? Got request to add child to nonexistent parent: ',request.message);
        }
        if (!parent.children) {
            parent.children = [];
        }
        parent.children.push(request.message.child);
    }
    if (request.action=='updateTag') {
        console.log('Got request to update content...');
        if (!parsed[sender.tab.id]) {
            parsed[sender.tab.id] = {}
        }
        if (!parsed[sender.tab.id][request.message.id]) {
            parsed[sender.tab.id][request.message.id] = {}
        }
        let oldData = parsed[sender.tab.id][request.message.id]
        let newParsed = {...oldData.parsed,...request.message.parsed}
        parsed[sender.tab.id][request.message.id] = {
            ...oldData,
            ...request.message,
            parsed:newParsed
        }
        console.log('=>',parsed[sender.tab.id][request.message.id])
    }
    if (sendResponse) {
        sendResponse(parsed[sender.tab.id]);
    }
    respondToPoll(sender.tab.id,
                  {
                      lastAction : request
                  });
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
            const {parentID,childID} = request
            let parent = parsed[sender.tab.id][parentID];
            if (!parent) {
                console.log('WTF? Got request to add child to nonexistent parent: ',request.message);
                throw Error('WTF? Got request to add child to nonexistent parent: ',request.message);
            }
            if (!parent.children) {
                parent.children = [];
            }
            respondToPoll(sender.tab.id);
            parent.children.push(childID)
            return parsed[sender.tab.id]
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
            return pageInfo
        },
        true // external
    );
    
    backgroundParsePage.receive(
        async (msg, sender)=>{
            console.log('parse page...',sender.tab)
            return await contentParsePage.send(null, sender.tab);
        },
        true // external
    );

    backgroundClearAll.receive(
        async (msg, sender) => {
            console.log('Got clear all');
            parsed[sender.tab.id] = {}
            await contentClearAll.send(null, sender.tab);
            return parsed[sender.tab.id];
        },
        true
    );

    backgroundClearOne.receive(
        async (id, sender) => {
            delete parsed[sender.tab.id][id];
            contentClearOne.send(id,sender.tab);
            return parsed[sender.tab.id]
        },
        true
    )
    // [contentParsePage,
    //     backgroundGetPageInfo,
    //     contentGetPageInfo,
    //     backgroundClearOne,
    //     contentClearOne,
    //     backgroundClearAll,
    //  contentClearAll]
}
