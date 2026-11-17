import {is_in} from '../../utils/validator.js';
import RecDef from '../../common/RecDef.js';
import Channel,{BACKGROUND,CONTENT} from './channel.js';

export const contentGetPageInfo = new Channel({
    name:'pageInfo',
    type:CONTENT,
    requestDef:null,
    responseDef:{url:'',title:''},    
});

export const backgroundGetPageInfo = new Channel({
    name:'pageInfo',
    type:BACKGROUND,
    requestDef:null,
    responseDef:{url:'',title:''},
})

export const contentParsePage = new Channel({
    name:'parseRecipes',
    type:CONTENT,
    requestDef:true, // boolean for silent mode
    responseDef:[{id:''}],
});

export const backgroundParsePage = new Channel({
    name:'parseRecipes',
    type:BACKGROUND,
    requestDef:true, // boolean...
    responseDef:[{id:''}],
});


const tags = RecDef.importProps.map((p)=>p.name)

export const contentParseSelection = new Channel({
    name:'parseSelection',
    type:CONTENT,
    requestDef:is_in(tags),
    responseDef:{id:'',tag:is_in(tags)},
    chatty:true
});

export const backgroundParseSelection = new Channel({
    name:'parseSelection',
    type:BACKGROUND,
    requestDef:is_in(tags),
    responseDef:{id:'',tag:is_in(tags)},
    chatty:true
});

export const backgroundClearAll = new Channel({
    name:'clearAll',
    type:BACKGROUND,
    requestDef:null,
    responseDef:true,
    
});

export const contentClearAll = new Channel({
    name:'clearAll',
    type:CONTENT,
    requestDef:null,
    responseDef:true,
});

export const contentClearOne = new Channel({
    name:'clearOne',
    type:CONTENT,
    requestDef:'id',
    responseDef:true,
});

export const backgroundClearMany = new Channel({
    name:'clearMany',
    type:BACKGROUND,
    requestDef:[],
    responseDef:true,
});

export const contentClearMany = new Channel({
    name:'clearMany',
    type:CONTENT,
    requestDef:[],
    responseDef:true,
});


export const backgroundClearOne = new Channel({
    name:'clearOne',
    type:BACKGROUND,
    requestDef:'id',
    responseDef:true,
});

