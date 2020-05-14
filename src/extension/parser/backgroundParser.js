// runs in background tab
export const parsed = {
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
