// Two-way port between content and background

export function ContentBackgroundChannel ({name, messageDef={}, chatty=true,
                                           //reconnect=true
                                          }) {
    let reconnect =  false;  // Reconnect was a BAD idea (extension ends up gobbling CPU -- either fix or forget it)

    let ports = {}
    let initialized
    let onConnect;

    let thePort;

    let brcb; // store callbacks for reconnecting
    let crcb;
    // In a world where we receive only the messages we care about...
    function backgroundReceive (tab,receiveCallback) {
        brcb = receiveCallback // save for reconnecting
        let port = chrome.tabs.connect(
            tab,{name}
        );
        if (chatty) {
            console.log(name,'Setting up receiver for messages...',port.sender);
        }
        port.onMessage.addListener(receiveCallback)
        ports[tab] = port;
        port.onDisconnect.addListener(
            ()=>{
                console.log('Port disconnected',tab,port);
                delete ports[tab];
                if (reconnect) {
                    backgroundReceive(tab,brcb);
                }
            }
        );
        return port.disconnect
    }

    function contentReceive (receiveCallback) {
        crcb = receiveCallback; // store for reconnecting...
        chrome.runtime.onConnect.addListener(
            (port,sender) => {
                if (port.name==name) {
                    if (chatty) {
                        'Content got a request for a port!';
                        thePort = port;
                        port.onMessage.addListener(receiveCallback);
                        if (onConnect) {
                            onConnect();
                        }
                    }
                }
                port.onDisconnect.addListener(
                    ()=>{
                        console.log('Port disconnected',port);
                        thePort = undefined;
                        if (reconnect) {
                            contentReceive(crcb)
                        }
                    }
                );
            }
        );
        // let port = chrome.runtime.connect(
        //     {name}
        // );
        // if (chatty) {
        //     console.log(name,'Setting up receiver for messages...',port.sender);
        // }
        // port.onMessage.addListener(receiveCallback)
        // return port.disconnect
    }

    function initializeSender () {
        initialized = true;
        chrome.runtime.onConnect.addListener(
            (port) => {
                if (port.name==name) {
                    if (chatty) {
                        console.log('initialzied sender for ',name);
                    }
                    ports[port.sender.tab.id] = port;
                    if (onConnect) {
                        onConnect(port.sender.tab.id);
                    }
                }
            }
        ) // end addListener
    }

    function send (message, tab=null) {
        if (!tab) {
            if (!thePort) {
                console.log('Attempted to send message to unopen port :(')
                return;
            }
            try {
                thePort.postMessage(message)
            } catch (err) {
                if (err.message.match(/disconnect/)) {
                    console.log('Attempted to use disconnected port',err);
                    thePort = undefined;
                    if (reconnect) {
                        console.log("Attempt to reconnect");
                        contentReceive(crcb);
                    }
                } else {
                    throw err;
                }
            }
        } else {
            tab = Number(tab);
            if (isNaN(tab)) {
                throw `Tab must be a numeric ID, but we got ${tab}`
            }
            if (!initialized) {
                console.log(name,"Warning, sender never initialized. Initalizing now?");
                initializeSender();
            }
            if (ports[tab]) {
                if (chatty) {
                    console.log(`${name}: ${tab}=>postMessage(${message})`);
                }
                try {
                    ports[tab].postMessage(message)
                } catch (err) {
                    if (err.message.match(/disconnected/)) {
                        console.log('Port disconnected');
                        delete ports[tab]
                        if (reconnect) {
                            console.log('Reconnect...')
                            backgroundReceive(tab,brcb)
                        }
                    } else {
                        throw err;
                    }
                }
            } else {
                console.log(name,'UNABLE TO POST MESSAGE',message,'to tab',tab,'we only have ports open for: ',ports);
            }
        }
    }

    function onPortConnect (handler) {
        onConnect = handler;
    }
    
    return {
        send,
        backgroundReceive,
        contentReceive,
        initializeSender,
        onPortConnect,
        ports
    }


    
}
