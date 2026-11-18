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
     {matcher:/eggplant|aubergine|gh?anou/i, color: {bg:'#614051',fg:'#ffdcff'}},
     {matcher:/chocolate|brownie|cocoa|\bfudge/i, color: {bg:'#5c3317',fg:'#e3cbb5'}},
     {matcher:/asparagus/i, color : {bg: '#87a96b', fg:'#edfdef'}},
     {matcher:/spinach/i, color: {bg:'#455439',fg:"#deffcd"}},
     {matcher:/apple/i, color: {bg:'#ff0800',fg:'#ffdfee'}},
     {matcher:/tomato/i, color: {bg:'#9f0404',fg:'#ffd4c2'}},
     {matcher:/lemon/i,color:{bg:'#fff04d',fg:'#368321'}},
     {matcher:/orange/i,color:{fg:'#ffeed6',bg:'#f69813'}},
     {matcher:/pumpkin/i,color:{fg:'#5c3f00',bg:'#e19005'}},
     {matcher:/avocado/i,color:{fg:'#181E10',bg:'#d7e869'}},
     {matcher:/blueberr|blackberr|\bberry\b|\bberries\b/i, color:{bg:'#3f3a8c',fg:'#e8e6ff'}}, // dusk
     {matcher:/strawberr|raspberr|cranberr|cherr/i, color:{bg:'#a4133c',fg:'#ffe1ea'}}, // crimson
     {matcher:/coffee|espresso/i, color:{bg:'#3b2a20',fg:'#f1d9b5'}}, // dark roast
     {matcher:/caramel|butterscotch|toffee|maple/i, color:{bg:'#c68e17',fg:'#2c1b00'}},
     {matcher:/coconut/i, color:{bg:'#f7f3e8',fg:'#5a3a22'}},
     {matcher:/\blime|mango|pineapple|citrus/i, color:{bg:'#9acd32',fg:'#1d2d00'}},
     {matcher:/peppermint|\bmint\b/i, color:{bg:'#b8f2e6',fg:'#0b4f43'}},
     {matcher:/chile|jalape|chipotle|harissa|sriracha|sizzl|fajita/i, color:{bg:'#c8401a',fg:'#fff4e8'}}, // heat
     {matcher:/chickpea|chana|lentil|\bbeans?\b|hummus|falafel/i, color:{bg:'#c8a165',fg:'#2f1d05'}},
     {matcher:/squash|sweet potato|carrot|turmeric/i, color:{bg:'#a8500f',fg:'#fff0dc'}},
     {matcher:/chard|kale|cabbage|brussels|bok choy|collard|broccoli|sprouts/i, color:{bg:'#2a7d4f',fg:'#e9ffe9'}}, // leafy greens
     {matcher:/basil|thyme|parsley|cilantro|fennel|herb|pesto|scallion|celery|cucumber/i, color:{bg:'#8fb339',fg:'#1b2d00'}},
     {matcher:/mushroom|potato|leek|onion|garlic|\broot\b/i, color:{bg:'#6f5a4b',fg:'#fff4e6'}},
     {matcher:/peanut|pecan|walnut|almond|pistachio|hazelnut/i, color:{bg:'#8c5a36',fg:'#fff3e6'}},
     
     {matcher:/\bsea\b|fish|salmon|crab|lobster|squid|calamar/i, color : {bg: '#0077BE',
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
     {matcher:/mexic/i,color:{bg:'#a55409',fg:'#ffe294'}},     
     {matcher:/spanish|spain/i, color: {bg:'#FED76A',fg:'#6A1410'}}, 
     {matcher:/vietnam|\bpho\b|b[aá]nh|lemongrass/i, color:{bg:'#587a12',fg:'#f6ffd9'}},
     {matcher:/moroccan|tagine|african|ethiopia|berbere/i, color:{bg:'#b5451b',fg:'#fff1de'}},
     {matcher:/lebanes|middle eastern|turkish|israel|tabbouleh|shawarma|persian/i, color:{bg:'#1f6f6b',fg:'#e6fffb'}},
     {matcher:/cuban|venezuel|peru|brazil|colombia|cachapa|arroz|latin|caribbean/i, color:{bg:'#ff7f50',fg:'#3b0d00'}},
     {matcher:/korea|japan|ramen|udon|sushi|miso|teriyaki|noodle/i, color:{bg:'#1f1f2e',fg:'#ff9966'}},
     {matcher:/swed|scandinav|norweg|danish|german|polish|pepparkakor/i, color:{bg:'#00508a',fg:'#fecc02'}},
     // everyday dishes: the last resort before the plain brown
     {matcher:/soup|stew|chili|chowder|curry|korma|biryani|\bdal\b/i, color:{bg:'#a24936',fg:'#ffe8d9'}},
     {matcher:/\bpies?\b|galette|\btart|pastry|crust/i, color:{bg:'#8a5522',fg:'#fff1dc'}},
     {matcher:/\bcakes?\b|cupcake|muffin|scone/i, color:{bg:'#c9b8f0',fg:'#2d1a5c'}},
     {matcher:/breakfast|pancake|waffle|crepe|\beggs?\b|\boats?\b|frittata|quiche/i, color:{bg:'#ffe5b4',fg:'#7a2e00'}},
     {matcher:/beef|steak|\bribs?\b|brisket|lamb|pork|sausage|bacon|\bham\b|roast/i, color:{bg:'#5e2a2a',fg:'#ffe3d6'}},
     {matcher:/chicken|turkey|poultry/i, color:{bg:'#fbe8c3',fg:'#7a3e00'}},
     {matcher:/shrimp|\bcod\b|prawn|scallop|seafood/i, color:{bg:'#ff8b6a',fg:'#3d0f00'}},
     {matcher:/cheese|queso|feta|pecorino|parmesan|mozzarella/i, color:{bg:'#f5b83d',fg:'#3a2200'}},
     {matcher:/yogurt|cream|dairy/i, color:{bg:'#eef2f7',fg:'#25405f'}},
     {matcher:/pilaf|bulgur|quinoa|\brice\b|couscous|grain|risotto/i, color:{bg:'#d8c3a5',fg:'#3a2a14'}},
     {matcher:/winter|snow|frost/i, color:{bg:'#a8c5da',fg:'#0f2a3f'}},
     
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
    

export function getColor (recipe) {
    if (recipe) {
        for (let {matcher,color} of wordColors) {
            if (recipe && recipe.title && recipe.title.match(matcher)) {
                return color
            } else if (recipe && recipe.categories && recipe.categories.find((c)=>c.name && c.name.match(matcher))) {
                return color;
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
