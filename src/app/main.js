import { mount } from "svelte";
import "contain-css-svelte/vars/defaults.css";
// Tabs are underlined, and the underline slides to the tab you pick.
import "contain-css-svelte/vars/underlined-tabs.css";
import "../theme/gourmet.css";
import App from "./App.svelte";

mount(App, { target: document.getElementById("app") });
