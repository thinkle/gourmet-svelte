import Color from 'color';
let color

 export const wordColors = [
     // easter eggs...
     {matcher:/easter\b/i, color : {
         fg:'#6434b2',
         bg:'#dcf9a8'
     }},
     {matcher:/halloween/i, color : {
         bg:'#000000',
         fg:'#f97306',
     }},
     {matcher:/christmas/i, color : {
         bg : '#2b3d0a',
         fg: '#e3f2d9',
     }},

     // some whimsical ingredient matchers
     {matcher:/eggplant|aubergine|gh?anou/i, color: {bg:'#614051',fg:'#ffdcff'}, ingredient:true},
     {matcher:/chocolate|brownie|cocoa|\bfudge/i, color: {bg:'#5c3317',fg:'#e3cbb5'}},
     {matcher:/asparagus/i, color : {bg: '#87a96b', fg:'#edfdef'}, ingredient:true},
     {matcher:/spinach/i, color: {bg:'#455439',fg:"#deffcd"}},
     {matcher:/\bapple/i, color: {bg:'#ff0800',fg:'#ffdfee'}},
     {matcher:/tomato/i, color: {bg:'#9f0404',fg:'#ffd4c2'}},
     {matcher:/lemon/i,color:{bg:'#fff04d',fg:'#368321'}},
     {matcher:/orange/i,color:{fg:'#ffeed6',bg:'#f69813'}},
     {matcher:/pumpkin/i,color:{fg:'#5c3f00',bg:'#e19005'}, ingredient:true},
     {matcher:/avocado/i,color:{fg:'#181E10',bg:'#d7e869'}, ingredient:true},
     {matcher:/blueberr|blackberr|\bberry\b|\bberries\b/i, color:{bg:'#3f3a8c',fg:'#e8e6ff'}}, // dusk
     {matcher:/strawberr|raspberr|cranberr|cherr/i, color:{bg:'#a4133c',fg:'#ffe1ea'}}, // crimson
     {matcher:/coffee|espresso/i, color:{bg:'#3b2a20',fg:'#f1d9b5'}}, // dark roast
     {matcher:/caramel|butterscotch|toffee|maple/i, color:{bg:'#c68e17',fg:'#2c1b00'}},
     {matcher:/coconut/i, color:{bg:'#f7f3e8',fg:'#5a3a22'}, ingredient:true},
     {matcher:/\blime|citrus/i, color:{bg:'#9acd32',fg:'#1d2d00'}},
     {matcher:/peppermint|\bmint\b/i, color:{bg:'#b8f2e6',fg:'#0b4f43'}},
     {matcher:/\bchili\b|con carne|tex-?mex|texas|southwest/i, color:{bg:'#a8431f',fg:'#8ff0e0'}}, // adobe and turquoise
     {matcher:/carrot/i, color:{bg:'#ed9121',fg:'#3b1700'}, ingredient:true},
     {matcher:/pineapple/i, color:{bg:'#f4c430',fg:'#2d5a1b'}, ingredient:true}, // gold with a green crown
     {matcher:/mango/i, color:{bg:'#ffb347',fg:'#7a1f00'}, ingredient:true}, // blush
     {matcher:/chile|jalape|chipotle|harissa|sriracha|sizzl|fajita/i, color:{bg:'#c8401a',fg:'#fff4e8'}}, // heat
     {matcher:/chickpea|chana|lentil|hummus|falafel/i, color:{bg:'#e0b84a',fg:'#3a2a00'}},
     {matcher:/\bbeans?\b/i, color:{bg:'#6b2d5c',fg:'#ffe8f6'}},
     {matcher:/turmeric/i, color:{bg:'#f2b01e',fg:'#4a2c00'}, ingredient:true},
     {matcher:/sweet potato|\byams?\b/i, color:{bg:'#e2762d',fg:'#3a1500'}, ingredient:true},
     {matcher:/squash|butternut/i, color:{bg:'#f0a04b',fg:'#5a2a00'}, ingredient:true},
     {matcher:/\bchard|\bkale|cabbage|brussels|bok choy|collard|broccoli|sprouts/i, color:{bg:'#2a7d4f',fg:'#e9ffe9'}}, // leafy greens
     {matcher:/basil|thyme|parsley|cilantro|fennel|herb|pesto|scallion|celery|cucumber/i, color:{bg:'#8fb339',fg:'#1b2d00'}},
     {matcher:/mushroom/i, color:{bg:'#7d6b7d',fg:'#fff8ff'}},
     {matcher:/potato|\broot\b/i, color:{bg:'#e3c16f',fg:'#4a3200'}},
     {matcher:/onion|shallot|leek|garlic/i, color:{bg:'#8e3b6f',fg:'#fde8f3'}},
     {matcher:/peanut|pecan|walnut|almond|pistachio|hazelnut/i, color:{bg:'#f3e2c7',fg:'#5b3a1a'}},
     
     {matcher:/salmon/i, color:{bg:'#fa8072',fg:'#4a1008'}, ingredient:true},
     {matcher:/\bcrab|lobster|shrimp|prawn|crawfish|crayfish/i, color:{bg:'#b8201a',fg:'#fff0e6'}, ingredient:true},
     {matcher:/\bsea\b|fish|squid|calamar|\bcod\b|scallop|seafood|tuna/i, color : {bg: '#0077BE',
                                                                          fg:'#dedefe'}}, // - ocean blue
     // courses
     {matcher:/cookie|bread|\brolls?\b/i, color:{bg:'#eed9a0',fg:'#4c2307'}}, // beige
     {matcher:/dessert/i, color: {bg:'#FF3366',fg:'#ffdede'}}, // red/pink
     {matcher:/salad/i, color: {bg:'#bdeabd',
                                fg:'#133f13'
                               }}, // green

     // cuisines...
     {matcher:/greek|greece|mediterr/i, color: {bg:'#0154C7',fg:'#ebf1ff'}},
     {matcher:/pasta|italy|italian/i, color: {bg:'#ce2b37',fg:'#fedeed'}},
     {matcher:/india/i, color: {bg:'#FEB200',fg:'black'}}, // tumeric
     {matcher:/thai/i, color: {bg:'#fff194',fg:'#db5800'}}, // red/orange
     {matcher:/china|chinese|asian/i, color: {bg:'#c51015',fg:'#F8D803'}}, // red/orange
     {matcher:/french|france/i, color: {bg:'#456990',fg:'#ffc501'}}, // queen blue
     {matcher:/mexic/i,color:{bg:'#006847',fg:'#fdf1e0'}},     
     {matcher:/spanish|spain/i, color: {bg:'#FED76A',fg:'#6A1410'}}, 
     {matcher:/vietnam|\bpho\b|b[aá]nh|lemongrass/i, color:{bg:'#587a12',fg:'#f6ffd9'}},
     {matcher:/moroccan|tagine|african|ethiopia|berbere/i, color:{bg:'#b5451b',fg:'#fff1de'}},
     {matcher:/lebanes|middle eastern|turkish|israel|tabbouleh|shawarma|persian/i, color:{bg:'#1f6f6b',fg:'#e6fffb'}},
     {matcher:/cuban|venezuel|peru|brazil|colombia|cachapa|arroz|latin|caribbean/i, color:{bg:'#ff7f50',fg:'#3b0d00'}},
     {matcher:/japan|ramen|udon|sushi|miso|teriyaki|tempura|\bsoba\b/i, color:{bg:'#bc002d',fg:'#ffffff'}}, // the flag
     {matcher:/korea|noodle/i, color:{bg:'#1c1c1c',fg:'#ff5a5f'}},
     {matcher:/swed|scandinav|norweg|danish|german|\bpolish\b|pepparkakor/i, color:{bg:'#00508a',fg:'#fecc02'}},
     // everyday dishes: the last resort before the plain brown
     {matcher:/curry|masala|tikka|korma|biryani|vindaloo|karahi|\bdal\b/i, color:{bg:'#1a1a1a',fg:'#ffc61a'}}, // curry powder
     {matcher:/soup|stew|chowder|bisque/i, color:{bg:'#a24936',fg:'#ffe8d9'}},
     {matcher:/\bpies?\b|galette|\btarts?\b|pastry|crust/i, color:{bg:'#e8b86d',fg:'#5a1f00'}},
     {matcher:/\bcakes?\b|cupcake|muffin|scone/i, color:{bg:'#c9b8f0',fg:'#2d1a5c'}},
     {matcher:/breakfast|pancake|waffle|crepe|\beggs?\b|\boats?\b|frittata|quiche/i, color:{bg:'#ffe5b4',fg:'#7a2e00'}},
     {matcher:/beef|steak|\bribs?\b|brisket|lamb|pork|sausage|bacon|\bham\b|roast/i, color:{bg:'#7b1e2b',fg:'#ffe3d6'}},
     {matcher:/chicken|turkey|poultry/i, color:{bg:'#fbe8c3',fg:'#7a3e00'}},
     {matcher:/cheese|queso|feta|pecorino|parmesan|mozzarella/i, color:{bg:'#f5b83d',fg:'#3a2200'}},
     {matcher:/yogurt|cream|dairy/i, color:{bg:'#eef2f7',fg:'#25405f'}},
     {matcher:/pilaf|bulgur|quinoa|\brice\b|couscous|grain|risotto/i, color:{bg:'#f0dc9c',fg:'#4a3a10'}},
     {matcher:/winter|\bsnow|\bfrost(?!ing)/i, color:{bg:'#a8c5da',fg:'#0f2a3f'}},
     
 ]
wordColors.forEach(
    (wc)=>{
        if (!wc.color.fg) {
            wc.color.fg = generateContrast(wc.color.bg)
        } else if (!wc.color.bg) {
            wc.color.bg = generateContrast(wc.color.fg)
        }
        wc.contrast = Color(wc.color.fg).contrast(Color(wc.color.bg))
    }
);

function generateContrast (c) {
    let color = Color(c);
    let contrast = color.lighten(1).whiten(0.5);
    return contrast.hex()
}
    

const ingredientTexts = (list, out = []) => {
    for (const i of list || []) {
        if (i?.text) out.push(i.text);
        if (i?.ingredients) ingredientTexts(i.ingredients, out);
    }
    return out;
};

/**
   Which palette a recipe wears. The rules are tried in list order, but on one
   part of the recipe at a time: the title first, then the categories, then
   (only for rules flagged `ingredient: true`, the distinctive ones) the
   ingredients. So "Beef Soup" with carrots in it is beef, "Carrot Soup" is
   carrot, and within one pass the list order decides ("carrot" before
   "curry" before "soup").
*/
export function getColor (recipe) {
    if (recipe) {
        const passes = [
            [(r) => r.test(recipe.title ?? ''), () => true],
            [(r) => (recipe.categories ?? []).some((c) => c?.name && r.test(c.name)), () => true],
            [(r) => ingredientTexts(recipe.ingredients).some((t) => r.test(t)), (w) => w.ingredient],
        ];
        for (const [hits, allowed] of passes) {
            for (const w of wordColors) {
                if (allowed(w) && hits(w.matcher)) return w.color;
            }
        }
    }
    // generic...
    return {
        fg: '#fff0a3',
        bg : '#7a4443'
    }
}

export function getStyle (recipe, otherStyle='') {
    let color = getColor(recipe);
    if (color) {
        return `--accent-bg: ${color.bg}; --accent-fg: ${color.fg};${otherStyle}`
    } else {
        return otherStyle;
    }
}
