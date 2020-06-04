import {is_in} from '../../utils/validator.js';
import RecDef from '../../common/RecDef.js';
import Channel,{BACKGROUND,CONTENT} from './channel.js';

export const contentGetPageInfo = new Channel({
    name:'pageInfo',
    type:'content',
    requestDef:null,
    responseDef:{url:'',title:''},    
});

export const backgroundGetPageInfo = new Channel({
    name:'pageInfo',
    type:'background',
    requestDef:null,
    responseDef:{url:'',title:''},
})

export const contentParsePage = new Channel({
    name:'parseRecipes',
    type:'content',
    requestDef:true, // boolean for silent mode
    responseDef:[{id:''}],
});

export const backgroundParsePage = new Channel({
    name:'parseRecipes',
    type:'background',
    requestDef:true, // boolean...
    responseDef:[{id:''}],
});


const tags = RecDef.importProps.map((p)=>p.name)

export const contentParseSelection = new Channel({
    name:'parseSelection',
    type:'content',
    requestDef:is_in(tags),
    responseDef:{id:'',tag:is_in(tags)},
    chatty:true
});

export const backgroundParseSelection = new Channel({
    name:'parseSelection',
    type:'background',
    requestDef:is_in(tags),
    responseDef:{id:'',tag:is_in(tags)},
    chatty:true
});

export const backgroundClearAll = new Channel({
    name:'clearAll',
    type:'background',
    requestDef:null,
    responseDef:true,
    
});

export const contentClearAll = new Channel({
    name:'clearAll',
    type:'content',
    requestDef:null,
    responseDef:true,
     
});

export const contentClearOne = new Channel({
    name:'clearOne',
    type:'content',
    requestDef:'id',
    responseDef:true,
});

export const backgroundClearMany = new Channel({
    name:'clearMany',
    type:'background',
    requestDef:[],
    responseDef:true,
});

export const contentClearMany = new Channel({
    name:'clearMany',
    type:'content',
    requestDef:[],
    responseDef:true,
});


export const backgroundClearOne = new Channel({
    name:'clearOne',
    type:'background',
    requestDef:'id',
    responseDef:true,
});

