import Metadata from '../common/RecDef.js';
import {listen} from './parser/backgroundParser.js';
import {launchTab} from './SidebarCommunication.js';
//import {listenForConnections} from './messaging/polling.js';
import ContextMenus from './ContextMenus.js';
console.log('Extension last built at BUILD_TIME')
listen();
chrome.browserAction.onClicked.addListener(launchTab);
ContextMenus.init();
