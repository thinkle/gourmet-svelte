/**
This is the only way to *push* messages to a webpage in an iframe or what have you... 
**/
import chromeExtensionId from '../id.js'
export const pollers = {}

const connectHandlers = [];
export function onConnectToPoll (cb) {
    connectHandlers.push(cb)
    
}

export function listenForConnections () {
    chrome.runtime.onConnectExternal.addListener(
        function(port) {
            console.log('GOT EXTERNAL CONNECTION!')
            if (port.name=='poll') {
                console.log('SET UP POLL EXTERNAL CONNECTION!')
                debugger;
                port.onMessage.addListener(
                    (msg)=>{console.log('Weird, we got a message from the webpage via polling -- we have not implemented that')}
                );
                
                if (!pollers[port.sender.tab.id] ) {
                    pollers[port.sender.tab.id] = []
                }
                console.log('Adding item to pollers for tab',port.sender.tab.id);
                pollers[port.sender.tab.id].push(sendToWeb);
                console.log('Adding item to pollers for tab',port.sender.tab.id,pollers[port.sender.tab.id].push(sendToWeb));

                
                port.onDisconnect.addListener(
                    (p)=>{
                        console.log('DISCONNECT',p);
                        pollers[port.sender.tab.id].splice(pollers[port.sender.tab.id].indexOf(sendToWeb),1)
                    }
                );

                connectHandlers.forEach(
                    (h)=>h(port)
                )

                function sendToWeb (msg) {
                    try {
                        port.postMessage(msg);
                    }
                    catch (err) {
                        console.log('Error using port?',err);
                    }
                }
            }
            else {
                console.log('Unknown connection request',port.name);
            }
        }
    );
}

export function listenToExtension (listener) {
    let poller = connectToExtension('poll')
    poller.onMessage.addListener(listener);
    return poller
}

export function connectToExtension (name) {
    // const {name,
    //        disconnect,
    //        onDisconnect,
    //        onMessage,
    //        postMessage,
    //        sender}
    return chrome.runtime.connect(
        chromeExtensionId,{name}
    );
}
