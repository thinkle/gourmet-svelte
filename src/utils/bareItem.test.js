// The bare item of an ingredient (src/utils/bareItem.js). Examples are
// invented or generic; none is copied from a stored recipe.
import { bareItem, bareItemKey, singular, shopItemFor } from './bareItem.js';

describe('bareItem', () => {
    test.each([
        // the brief's examples
        ['unsalted butter (2 1/2 sticks)', 'butter'],
        ['all-purpose flour, sifted', 'flour'],
        ['large eggs, beaten', 'eggs'],
        ['1 (14 oz) can diced tomatoes', 'diced tomatoes'],
        ['kosher salt', 'kosher salt'],
        ['freshly ground black pepper', 'black pepper'],
        // amounts, units, containers still in the text
        ['2 cups all purpose flour', 'flour'],
        ['230g (2 sticks) salted butter, softened', 'butter'],
        ['1 1/2 tsp. vanilla extract', 'vanilla extract'],
        ['2-3 cloves garlic, minced', 'garlic'],
        ['½ cup packed brown sugar', 'brown sugar'],
        ['a large pinch of chile flakes', 'chile flakes'],
        ['of butter', 'butter'],
        ['15-ounce can black beans, drained and rinsed', 'black beans'],
        ['two 8-inch cake pans', 'cake pans'],
        // size, freshness, prep words anywhere
        ['chopped fresh parsley', 'parsley'],
        ['extra virgin olive oil', 'olive oil'],
        ['lean ground beef', 'ground beef'],
        ['boneless, skinless chicken breasts', 'chicken breasts'],
        ['garlic cloves, thinly sliced', 'garlic'],
        ['celery stalks', 'celery'],
        ['fresh cilantro leaves, for serving', 'cilantro'],
        ['bay leaves', 'bay leaves'],
        ['eggs beaten', 'eggs'],
        ['boiling water', 'water'],
        ['heavy cream or milk', 'heavy cream'],
        ['chicken or vegetable broth', 'chicken broth'],
        ['salt and pepper to taste', 'salt and pepper'],
        ['hot sauce', 'hot sauce'],
        ['freshly-grated parmesan cheese', 'parmesan cheese'],
        // things that change what you buy are kept
        ['ground cinnamon', 'ground cinnamon'],
        ['dried oregano', 'dried oregano'],
        ['whole milk', 'whole milk'],
        ['crushed red pepper flakes', 'crushed red pepper flakes'],
        ['powdered sugar', 'powdered sugar'],
        ['pork chops', 'pork chops'],
        ['cake mix', 'cake mix'],
        ['half and half', 'half and half'],
        ['cloves', 'cloves'],
        // markup and junk
        ['<p>vegetable oil</p>', 'vegetable oil'],
        ['▢ 1 cup sugar', 'sugar'],
        ['to taste', ''],
        ['softened', ''],
        ['diced', ''],
        ['(optional)', ''],
        ['', ''],
    ])('%s -> %s', (text, want) => {
        expect(bareItem(text)).toBe(want);
    });

    test('takes an ingredient object and odd input', () => {
        expect(bareItem({ text: 'large eggs' })).toBe('eggs');
        expect(bareItem(null)).toBe('');
        expect(bareItem(42)).toBe('');
        expect(bareItem({})).toBe('');
    });
});

describe('singular and bareItemKey', () => {
    test.each([
        ['eggs', 'egg'], ['berries', 'berry'], ['tomatoes', 'tomato'], ['peaches', 'peach'],
        ['leaves', 'leaf'], ['cloves', 'clove'], ['olives', 'olive'], ['molasses', 'molasses'],
        ['asparagus', 'asparagus'], ['couscous', 'couscous'], ['egg', 'egg'], ['peas', 'pea'],
    ])('singular(%s) = %s', (w, want) => expect(singular(w)).toBe(want));

    test('keys merge plurals, case, accents and hyphens', () => {
        expect(bareItemKey('Eggs')).toBe(bareItemKey('egg'));
        expect(bareItemKey('crème fraîche')).toBe('creme fraiche');
        expect(bareItemKey('dry-roasted peanuts')).toBe('dry roasted peanut');
        expect(bareItemKey({ text: '2 large eggs, beaten' })).toBe('egg');
        expect(bareItemKey('')).toBe('');
    });
});

describe('shopItemFor', () => {
    test('a stored shopItem wins, then ingkey, then the bare item', () => {
        expect(shopItemFor({ text: 'large eggs', shopItem: 'Eggs (dozen)', ingkey: 'egg' })).toBe('Eggs (dozen)');
        expect(shopItemFor({ text: 'large eggs', ingkey: 'egg' })).toBe('egg');
        expect(shopItemFor({ text: 'large eggs' })).toBe('eggs');
    });
});
