import Metadata from '../common/RecDef.js';
import {handleContentRequest,handleSidebarRequest} from './parser/backgroundParser.js';
import {launchTab} from './SidebarCommunication.js';
import ContextMenus from './ContextMenus.js';

console.log('Background loaded...');
chrome.runtime.onMessageExternal.addListener(handleSidebarRequest);
chrome.runtime.onMessage.addListener(handleContentRequest);
chrome.browserAction.onClicked.addListener(launchTab);
console.log('We are listening...');
ContextMenus.init();
console.log('We made context menus...')
