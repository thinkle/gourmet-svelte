// To talk to our web extension, we have to use a port.
import chromeExtensionId from '../id.js';


export function ChannelToWeb  ({name, messageDef={},chatty=true}) {

    let ports = {}
    let outbox = {}
    let initialized;
    let onConnect;
    
    // In a world where we receive only the messages we care about...
    function receive (receiveCallback) {
        let port = chrome.runtime.connect(
            chromeExtensionId,{name}
        );
        if (chatty) {
            console.log(name,'Setting up receiver for messages...',port.sender);
        }
        port.onMessage.addListener(receiveCallback)
        // port.onMessage.addListener(
        //     (msg)=>{
        //         if (chatty) {
        //             console.log('received ',msg,'at port',port);
        //         }
        //         receiveCallback(msg);
        //     }
        // );
        return port.disconnect
    }
    // In a world where we receive all the messages and have to filter...
    // function receive (receiveCallback, tab) {
    //     let port = chrome.runtime.connect(
    //         chromeExtensionId,{name}
    //     );
    //     port.onMessage.addListener(
    //         function (message) {
    //             if (message.tab==tab) {
    //                 receiveCallback(message.message);
    //             }
    //             else if (chatty) {
    //                 console.log('Ignoring message for other tab: ',message,'we are tab ',tab);
    //             }
    //         }
    //     )
    // }

    function initializeSender () {
        initialized = true;
        chrome.runtime.onConnectExternal.addListener(
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

    function send (tab, message) {
        debugger;
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
            ports[tab].postMessage(message)
        } else {
            console.log(name,'UNABLE TO POST MESSAGE',message,'to tab',tab,'we only have ports open for: ',ports);
            console.log(name,'Saving message to send later...');
            if (!outbox[tab]) {
                outbox[tab] = []
            }
            outbox[tab].push(message);
        }
    }


    function onWebConnect (handler) {
        onConnect = handler;
    }
    
    // function send (message, tab) {
    //     if (!sendingPorts[tab.id]) {
    //         setupSendingPort(tab.id);
    //     }
    //     validate( );
        
    // }

    return {
        send,initializeSender,receive,onWebConnect,ports
    }
}

