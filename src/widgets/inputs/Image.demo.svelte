<script>
 import ImageEntry from './ImageEntry.svelte'
 let url
</script>

Image Widget: <ImageEntry bind:url="{url}" />

And the image is...? <img src="{url}">
