import { mount } from "svelte";
import "contain-css-svelte/vars/defaults.css";
// Tabs are underlined, and the underline slides to the tab you pick.
import "contain-css-svelte/vars/underlined-tabs.css";
// Fields are underline style, as in old Gourmet; focus grows the rule.
import "contain-css-svelte/vars/underline-fields.css";
// Every colour the app names, for daylight and for the dark.
import "../theme/scheme.css";
import "../theme/gourmet.css";
// Ctrl+P: the open recipe or the shopping list, on paper.
import "../theme/print.css";
import App from "./App.svelte";
import { initColorScheme } from "./colorScheme.js";

// Before the first paint: the browser's preference, or a pinned scheme.
initColorScheme();

mount(App, { target: document.getElementById("app") });
