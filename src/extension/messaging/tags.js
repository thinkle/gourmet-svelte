import Channel from './channel.js';

export const backgroundRemoveTag = new Channel({
    name:'removeTag',
    type:'background',
    requestDef:'id',
    responseDef:true,
})

export const backgroundAddTag = new Channel({
    name:'addTag',
    type:'background',
    requestDef:{id:'id'},
    responseDef:{},
})
export const backgroundAddTags = new Channel({
    name:'addTags',
    type:'background',
    requestDef:[{id:'id'}],
    responseDef:{},
})
export const backgroundUpdateTag = new Channel({
    name:'updateTag',
    type:'background',
    requestDef:{id:'id'},
    responseDef:{},
})
export const backgroundAddChild = new Channel({
    name:'addChild',
    type:'background',
    requestDef:{parent:'id',child:'id'},
    responseDef:{},
})
