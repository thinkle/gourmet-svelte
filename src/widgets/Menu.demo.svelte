<script>
import Menu from './Menu.svelte'
import MenuItem from './MenuItem.svelte'
import ipsum from '../common/mocks/ipsum.js'

</script>
<div>    
Default:
<Menu>
<MenuItem>Here is a menu item</MenuItem>
<MenuItem icon="add_shopping_cart">menu item w/ icon</MenuItem>
<li>Here is a linke <a href="#">content</a></li>
<li>focusable <input type='text'></li>
<MenuItem>another menu item</MenuItem>
</Menu>
{ipsum.generate(50)}
<Menu anchorRight={true}>
<MenuItem>another menu item</MenuItem>
<li>This one is</li>
<li><button>anchored</button> from</li>
<li>the right</li>
</Menu>
{ipsum.generate(200)}
</div>
Bottom <Menu anchorBottom={true}>
<MenuItem>another menu item</MenuItem>
Here is some
<br><button>Focusable Content</button>
<br>That
<br>Should slide
<br>Down
</Menu>

