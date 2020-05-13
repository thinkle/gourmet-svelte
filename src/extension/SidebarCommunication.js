var parsed = {
}

export function launchTab (tab) {
    console.log('browser action triggered: launch tab');
    chrome.tabs.executeScript(
        tab.id,
        {file:'embed.js'}, // inject sidebar code, which listens for a message w/ id
        function () { // send message with id
            chrome.tabs.sendMessage(tab.id,
                                    {tabId:tab.id});
            if (parsed[tab.id]) {
                // clear out parsed rec
                parsed[tab.id] = {}
            }
            chrome.tabs.sendMessage(tab.id,
                                    {action:'parsePage'});
        });
}

export function handleContentRequest (request, sender, sendResponse) {
    console.log('Got content request');
    if (request.action=='removeTag') {
        console.log('Deleting...');
        delete parsed[sender.tab.id][request.id]
        console.log(parsed);
    }
    if (request.action=='addTag') {
        console.log('Adding tag (request from content)');
        console.log('Request: %s',JSON.stringify(request));
        if (!parsed[sender.tab.id]) {
            parsed[sender.tab.id] = {}
        }
        parsed[sender.tab.id][request.message.id]=request.message;
    }
}

export function handleSidebarRequest (request, sender, sendResponse) {
    console.log('Sidebar message incoming');
        console.log('Got message from sidebar: %s',
                    JSON.stringify({
                        request:request,
                        sender:sender,
                        sendResponse,sendResponse}));
        console.log('Message from tab: %s',sender.tab.url);
        sendResponse(
            {
                url : sender.tab.url,
                tabid : request.tabId || sender.tab.id, // we accept either...
                parsed : parsed[request.tabId||sender.tab.id],
            }
        );
}
