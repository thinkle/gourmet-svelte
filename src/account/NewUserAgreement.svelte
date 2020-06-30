<script>
 export let onDone
 
 import {Button} from '../widgets/';
 import {user} from '../stores/userStore.js';
 
 function accept () {
     user.markNotNew();
     if (onDone) {onDone()}
 }
 
</script>

<h2>You look new. Welcome!</h2>
<p>Sorry, I haven't hired any lawyers yet, so there are no formal terms and conditions.</p>
<p>Here's what I can tell you as a programmer: I'm trying
    my best to keep your data in good shape. I don't
    intend to pry on your data, but this is recipe data,
    not your diary.  I may in the future try to leverage
    collective recipe data to improve this software. So I
    promise not to steal your recipes, or publish them, or
    anything like that, but I might use or share some of
    the data you create in order to train this software to
    do a better job understanding food and recipes.</p>
<p>Also, the main goal of this software is to help you
    clip and keep recipes. For that reason, your recipes
    are meant to be personal &mdash; this is not a
    publishing platform &mdash; it's more like the digital
    website-scraping version of that box full of notecards
    hanging out in your kitchen.</p>
<Button on:click="{accept}">Accept Agreement</Button>
<!-- End New User Agreement -->
