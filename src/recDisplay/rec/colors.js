import Color from 'color';
let color

 export const wordColors = [
     // easter eggs...
     {matcher:/easter\b/i, color : {
         fg:'#6434b2',
         bg:'#dcf9a8'
     }},
     {matcher:/halloween/i, color : {
         bg:'#1f0905',
         fg:'#f97306',
     }},
     {matcher:/christmas/i, color : {
         bg : '#2b3d0a',
         fg: '#e3f2d9',
     }},

     // some whimsical ingredient matchers
     {matcher:/eggplant|aubergine|gh?anou/i, color: {bg:'#614051',fg:'#ffdcff'}},
     {matcher:/chocolate|brownie/i, color: {bg:'#5c3317',fg:'#e3cbb5'}},
     {matcher:/\bsea\b|fish|salmon|crab|lobster|squid|calamar/i, color : {bg: '#0077BE',
                                                                          fg:'#dedefe'}}, // - ocen blue
     {matcher:/asparagus/i, color : {bg: '#87a96b', fg:'#edfdef'}},
     {matcher:/spinach/i, color: {bg:'#455439',fg:"#deffcd"}},
     {matcher:/apple/i, color: {bg:'#ff0800',fg:'#ffdfee'}},
     {matcher:/tomato/i, color: {bg:'#9f0404',fg:'#ffd4c2'}},
     {matcher:/lemon/i,color:{bg:'#fff04d',fg:'#368321'}},

     
     // courses
     {matcher:/cookie|bread/i, color:{bg:'#fdcf4c',fg:'#4c2307'}}, // beige
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
     {matcher:/mexic/,color:{bg:'#a55409',fg:'#ffe294'}},     
     {matcher:/spanish|spain/i, color: {bg:'#FED76A',fg:'#6A1410'}}, 
     
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
     for (let {matcher,color} of wordColors) {
         if (recipe && recipe.title && recipe.title.match(matcher)) {
             return color
         } else if (recipe && recipe.categories && recipe.categories.find((c)=>c.name && c.name.match(matcher))) {
             return color;
         }
     }
     // generic...
     return {
         bg: '#AFD2E9',
         fg: '#121234'
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
