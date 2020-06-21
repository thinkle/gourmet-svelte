import {ChannelToWeb} from './WebChannel.js';
import Channel,{BACKGROUND,CONTENT} from './channel.js';
import {ContentBackgroundChannel} from './ContentBackgroundChannel.js';

export const contentHighlightIng = new Channel({
    name : 'highlightIng',
    type : CONTENT,
    requestDef : {highlighted:'',hover:''},
    responseDef : true,
    
});

export const backgroundSetIngredients = new Channel({
    name : 'setIngredientList',
    type : BACKGROUND,
    requestDef : [{}],
    responseDef:true,
});

export const contentSetIngredients = new Channel({
    name : 'setIngredientList',
    type : CONTENT,
    requestDef : [{}],
});


export const backgroundHighlightIng = new Channel({
    name : 'highlightIng',
    type : BACKGROUND,
    requestDef : {},
    responseDef:true,
});

export const sendHighlightToWeb = new ChannelToWeb(
    {
        name : 'highlight',
        chatty : true
    }
);


export const highlightedIngredientsCB = ContentBackgroundChannel(
    {name:'highlight',
     chatty:true}
);
