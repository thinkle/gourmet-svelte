import {parsed} from './parser/backgroundParser.js';

export function launchTab (tab) {
    console.log('browser action triggered: launch tab');
    chrome.tabs.executeScript(
        tab.id,
        {file:'embed.js'}, // inject sidebar code, which listens for a message w/ id
        // function () { // send message with id
        //     chrome.tabs.sendMessage(tab.id,
        //                             {tabId:tab.id});
        //     if (parsed[tab.id]) {
        //         // clear out parsed rec
        //         parsed[tab.id] = {}
        //     }
        //     chrome.tabs.sendMessage(tab.id,
        //                             {action:'parsePage'});
    );
}

