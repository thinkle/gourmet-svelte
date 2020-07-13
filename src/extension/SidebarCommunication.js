import {parsed} from './parser/backgroundParser.js';

export function launchTab (tab) {
    console.log('browser action triggered: launch tab');
    chrome.tabs.executeScript(
        tab.id,
        {file:'content.js'}
    );
    chrome.tabs.executeScript(
        tab.id,
        {file:'embed.js'},
    );
}

