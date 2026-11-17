import {ContentBackgroundChannel} from './ContentBackgroundChannel.js';

export const hello = ContentBackgroundChannel(
    {name:'howdyhar',
     chatty:true}
);
export const reportSelection = ContentBackgroundChannel(
    {name:'selection',
     chatty:true}
);
