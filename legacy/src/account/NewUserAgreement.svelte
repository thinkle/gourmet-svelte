<script>
 export let onDone
 
 import {Button} from '../widgets/';
 import {user} from '../stores/userStore.js';
 import RecipeTextStyle from '../recDisplay/text/RecipeTextStyle.svelte'
 
 function accept () {
     user.markNotNew();
     if (onDone) {onDone()}
 }
 
</script>
<RecipeTextStyle>
<h2>You look new. Welcome!</h2>
<p>Sorry, I haven't hired any lawyers yet, but I figured I should give you some terms and conditions.</p>
<p>By creating an account here at gourmetrecipemanager.com, you're letting me store your data on my own
    remote database. That allows you to access the same data from multiple devices. You'll also be storing
    data locally in your browser for faster retrieval/search/lookup, etc. (in theory it should even work offline
    so long as you already have the webpage loaded when the connection dies).</p>
<p>Here's what I can tell you as a programmer:</p>
    <ol>
        <li>I'm trying my best to keep your data in good shape.
            I won't delete it. If you need your data exported, I'll help
            you get it so you can use it in another format. That said, this
            software is in early days, so something could go wrong &mdash; if it is
            absolutely vital to you that you not lose your data, please contact me about
            a backup strategy.</li>
        <li>I don't intend to pry on your data, but this is recipe data,
            not your diary.  I may in the future try to leverage
            collective recipe data to improve this software. So I
            promise not to steal your recipes, or publish them, or
            anything like that, but I might use or share some of
            the data you create in order to train this software to
            do a better job understanding food and recipes.
        </li>
    </ol>
    <p>Note, the main goal of this software is to help you
        clip and keep recipes. For that reason, your recipes
        are meant to be personal &mdash; this is not a
        publishing platform &mdash; it's more like the digital
        website-scraping version of that box full of notecards
        hanging out in your kitchen. Please don't get me in trouble
        by trying to use this software to try to widely share copyrighted material.</p>
    <Button on:click="{accept}">Accept Agreement</Button>
</RecipeTextStyle>
<!-- End New User Agreement -->
<style>
</style>
