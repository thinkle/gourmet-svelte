import Metadata from '../common/RecDef.js';
import {handleContentRequest, handleSidebarRequest, launchTab} from './SidebarCommunication.js';

console.log('Background loaded...');
chrome.runtime.onMessageExternal.addListener(handleSidebarRequest);
chrome.runtime.onMessage.addListener(handleContentRequest);
chrome.browserAction.onClicked.addListener(launchTab);
console.log('We are listening...');
