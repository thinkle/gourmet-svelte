import Metadata from '../common/RecDef.js';
import {handleContentRequest} from './parser/backgroundParser.js';

/* Create context menu for marking up data */
function init () {

    chrome.contextMenus.create({
        title:'Gourmet Parse Recipe',
        id:'gourmet-top-page',
        contexts:['page'],
        onclick: (info,tabInfo)=>{
            console.log('Clicked "Parse"!')
            chrome.tabs.sendMessage(
                tabInfo.id,
                {action:'parsePage'},
                function (response) {
                    console.log('Got response',response);
                    handleContentRequest(
                        {action:'addTags',
                         message:response},
                        {tab:tabInfo},
                        ()=>{}
                    );
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


    function makeParseCallback (part) {
        return (info,tabInfo)=>{
            console.log('Gourmet %s: %s',part, JSON.stringify(info));
            console.log('tabInfo %s',JSON.stringify(tabInfo));
            chrome.tabs.sendMessage(
                tabInfo.id,
                {action:'parseSelection',
                 part:part},
                function (response) {
                    console.log('Got response back from content script!',response);
                    // register this with parser...
                    handleContentRequest(
                        {'action':'addTag',
                         message:response},
                        {tab:tabInfo},
                        ()=>{}
                    );
                }
            );
        }
    }

}
export default {init}
