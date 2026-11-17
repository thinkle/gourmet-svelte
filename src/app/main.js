import { mount } from "svelte";
import "contain-css-svelte/vars/defaults.css";
import "../theme/gourmet.css";
import App from "./App.svelte";

mount(App, { target: document.getElementById("app") });
