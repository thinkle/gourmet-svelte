/**
There's too many damned messages in Chrome Extensions to keep track of.

We're going to try to put some basic error checking and enforcement on this...

Want to send a message?
Fine. Define a "Channel" for communication in a stand-alone module and export it.
Then we just use it like this:

  const backgroundAddTag = Channel('addTag','background',{name:'string',parsed:{}},{tag:''});
  // This will ensure that all addTag messages have a name and a parsed object
  // and that they all RETURN an object with a property tag containing a string
  backgroundAddTag.send({msg}) => returns a promise which will resolve to a valid return value
  backgroundAddTag.receive(onMessage(msg)) => will be called with a valid request and must return a valid response.

  We can then import/export all message streams via channels so we don't have to be futzing around with 
  strings and changing my mind about what things are called and all that nonsense.
  
**/
import chromeExtensionId from '../id.js';
export const WEB = 'web'
export const BACKGROUND = 'background'
export const CONTENT = 'content'
import validate from '../../utils/validator.js';
const channels = {
    background:{},
    content:{},
}


function Channel ({name, type, requestDef={}, responseDef={}, chatty=false}) {
    if (!channels[type]) {
        console.log('Unrecognized channel type',type,'not one of',Object.keys(channels));
        throw Error(`Unknown Channel type: ${type}`)
    }
    if (channels[type][name]) {
        console.log(`Channel ${name} defined with null response, but null response is how google communicates errors`);
        throw Error(`Channel ${type} ${name} already defined`);
    }
    if (!responseDef) {
        console.log(`Channel ${name} defined with null response, but null response is how google communicates errors`);
        throw Error(`Channel ${name} defined with null response, but null response is how google communicates errors`);
    }
    channels[type][name] = this;
    this.send = function (request, tab) {
        if (chatty) {console.log('Channel',name,type,'send request',request,tab,'... first validating...')}
        if (type=='content') {
            validate(tab,{id:1})
        }
        validate(request,requestDef);
        console.log('Sending valid request',request);
        return sendMessage(type,request,name,tab,chatty);
    }

    this.receive = function (receiveCallback, external=false) {
        if (chatty) {console.log('Set up receiver',receiveCallback,name,external)}
        let base
        if (type=='background') {
            base = chrome.runtime
        }
        else if (type=='content') {
            base = chrome.extension
        }
        if (external) {
            if (chatty) {console.log('add external listener')}
            base.onMessageExternal.addListener(callback);
        }
        else {
            if (chatty) {console.log('add internal listener')}
            base.onMessage.addListener(callback);
        }

        async function callback (fullRequest, sender, sendResponse) {
            if (fullRequest.channelName == name) {
                if (chatty) {console.log('receive got callback',name,type,fullRequest,sender)}
                let response = receiveCallback(fullRequest.request,sender)
                if (response.then) {
                    if (chatty) {console.log('async... awaiting response',response)}
                    response = await response
                    if (chatty) {console.log('async... got response',response)}
                }
                if (chatty) {console.log('validating response',response,responseDef)}
                validate(response,responseDef);
                if (chatty) {console.log('Sending valid response',response);}
                sendResponse(response);
            }
            
        }
    }
    return this;
}


function sendMessage(type,request,name,tab) {
    return new Promise( (resolve,reject) => {
        if (type=='web') {
        }
        else if (type=='content') {
            chrome.tabs.sendMessage(
                tab.id,
                {channelName : name,
                 request,
                },
                cb
            );
        }
        else if (type=='background') {
            if (chrome.runtime.id) {
                chrome.runtime.sendMessage(
                    {channelName:name,
                     request},
                    cb
                );
            }
            else {
                chrome.runtime.sendMessage(
                    chromeExtensionId,
                    {channelName:name,
                     request},
                    cb
                );
            }
        }
        function cb (response) {
            if (response) {
                resolve(response);
            }
            else {
                console.log('No response? Must be an error!');
                reject(chrome.runtime.lastError);
            }
        }
    });
}

export default Channel;
