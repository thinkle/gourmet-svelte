import Metadata from '../common/RecDef.js';
import {listen} from './parser/backgroundParser.js';
import {launchTab} from './SidebarCommunication.js';
//import {listenForConnections} from './messaging/polling.js';
import ContextMenus from './ContextMenus.js';
console.log('Extension last built at BUILD_TIME')
listen();
console.log('Background loaded...');
chrome.browserAction.onClicked.addListener(launchTab);
console.log('We are listening...');
ContextMenus.init();
console.log('We made context menus...')
//listenForConnections();
// import {helloWorld} from './messaging/webMessages.js';
// helloWorld.initializeSender();
// setInterval(
//     ()=>{
//         console.log('Try to say hello?',helloWorld.ports.length,'ports')
//         for (let tab in helloWorld.ports) {
//             helloWorld.send(tab,`hello there ${tab}`);
//         }
//     },
//     5000
// );
