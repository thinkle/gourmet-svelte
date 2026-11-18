import { mount } from "svelte";
import "contain-css-svelte/vars/defaults.css";
// Tabs are underlined, and the underline slides to the tab you pick.
import "contain-css-svelte/vars/underlined-tabs.css";
// Fields are underline style, as in old Gourmet; focus grows the rule.
import "contain-css-svelte/vars/underline-fields.css";
import "../theme/gourmet.css";
import App from "./App.svelte";

mount(App, { target: document.getElementById("app") });
