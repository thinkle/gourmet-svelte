import {ChannelToWeb} from './WebChannel.js';
export const helloWorld = ChannelToWeb(
    {
        name : 'hello',
        chatty : true
    }
);

export const sendParsedToWeb = ChannelToWeb(
    {
        name : 'parsed',
        chatty : true
    }
);

export const sendSelectionToWeb = ChannelToWeb(
    {
        name : 'selection',
        chatty : true
    }
);
