/**
There's too many damned messages in Chrome Extensions to keep track of.

We're going to try to put some basic error checking and enforcement on this...

Want to send a message?
Fine. Define a "Channel" for communication in a stand-alone module and export it.
Then we just use it like this:
  Channel.send({msg}) => returns a promise
  Channel.receive(onMessage(msg)) => return value of onMessage is passed



**/

export const WEB = 'web'
export const BACKGROUND = 'background'
export const CONTENT = 'content'

const channels = {
    [WEB]:{},
    [BACKGROUND]:{},
    [CONTENT]:{},
}

function Channel (name, type, requestDef, responseDef) {
    if (!channels[type]) {
        console.log('Unrecognized channel type',type,'not one of',Object.keys(channels));
        throw Error(`Unknown Channel type: ${type}`)
    }
    if (channels[type][name]) {
        throw Error(`Channel ${type} ${name} already defined`);
    }
    channels[type][name] = this;
    this.send = function () {
        
    }

    this.receive = function (receiveCallback) {
        
    }
    return this;
}
