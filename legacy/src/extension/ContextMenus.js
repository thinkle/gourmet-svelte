import Metadata from '../common/RecDef.js';
import {addTags,addTag} from './parser/backgroundParser.js';
import {backgroundParseSelection,
        contentParsePage,
        contentParseSelection,
       } from './messaging/parsing.js';
/* Create context menu for marking up data */
function init () {
    let imageCount = 0;
    backgroundParseSelection.receive(
        async (tagname,sender)=>{
            console.log('Got',tagname);
            let tagData =  await contentParseSelection.send(tagname,sender.tab);
            addTag(sender.tab.id,tagData)
            return tagData;
        },
        true // EXTERNAL
    );

    chrome.contextMenus.create({
        title:'Gourmet Parse Recipe',
        id:'gourmet-top-page',
        contexts:['page'],
        onclick: async (info,tabInfo)=>{
            console.log('Clicked "Parse"!')
            let tags = await contentParsePage.send(false,tabInfo);
            addTags(tabInfo.id,tags)
        }   
    });

    chrome.contextMenus.create({
        title : 'Gourmet: tag image',
        id : 'gourmet-image',
        contexts:['image'],
        onclick : async (info, tabInfo)=>{
            imageCount += 1;
            addTag(tabInfo.id,
                   {
                       id : 'image'+imageCount,
                       html : `<img src="${info.srcUrl}">`,
                       tag : 'image'
                   }
                  );
        }
    });
        
    // chrome.contextMenus.create({
    //     title:'Gourmet',
    //     id:'gourmet-image-select',
    //     contexts:['image'


    chrome.contextMenus.create({
        title:"Gourmet: Mark-up Recipe",
        id:"gourmet-top",
        contexts:["selection"]
    });
    var allTheProps = Metadata.importProps;
    for (let prop of allTheProps)
    {
        chrome.contextMenus.create(
            {
                "title":prop.label,
                id:`gourmet-${prop.name}`,
                contexts:["selection"],
                parentId:'gourmet-top',
                onclick:makeParseCallback(prop.name)
            }
        );
    }


    function makeParseCallback (tag) {
        return async (info,tabInfo)=>{
            console.log('Gourmet %s: %s',tag, JSON.stringify(info));
            console.log('tabInfo %s',JSON.stringify(tabInfo));
            const tagData = await contentParseSelection.send(tag,tabInfo)
            addTag(tabInfo.id,tagData)
        }
    }

}
export default {init}
