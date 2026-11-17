<script>
 import ImageEntry from './ImageEntry.svelte'
 let url = "https://loremflickr.com/1920/1080"
 let value={}
</script>

Image Widget: <ImageEntry on:change="{(e)=>value=e.detail}" bind:url="{url}" />
<div>
    VALUE:
    value.url: {value.url && value.url.substr(0,100)}
    value.caption: {value.caption}
    value.float: {value.float}
    value.width: {value.width}
</div>
And the image is...? <img src="{url}">

<style>
    div {
    height: 100px;
    }
</style>
