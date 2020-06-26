import Color from 'color';
let color

 export const wordColors = [
     // some whimsical ingredient matchers
     {matcher:/eggplant|aubergine|gh?anou/i, color: {bg:'#614051',fg:'#ffdcff'}},
     {matcher:/chocolate/i, color: {bg:'#5c3317',fg:'#e3cbb5'}},
     {matcher:/\bsea\b|fish|salmon|crab|lobster|squid|calamar/i, color : {bg: '#0077BE',
                                                                          fg:'#dedefe'}}, // - ocen blue
     {matcher:/asparagus/i, color : {bg: '#87a96b', fg:'#edfdef'}},
     {matcher:/spinach/i, color: {bg:'#455439',fg:"#deffcd"}},
     {matcher:/apple/i, color: {bg:'#ff0800',fg:'#ffdfee'}},
     {matcher:/tomato/i, color: {bg:'#ff6347',fg:'#ffdfdf'}},
     
     // courses
     {matcher:/cookie|bread/i, color:{bg:'#fdcf4c',fg:'#4c2307'}}, // beige
     {matcher:/dessert/i, color: {bg:'#FF3366',fg:'#ffdede'}}, // red/pink
     {matcher:/salad/i, color: {bg:'#55ab55',
                                fg:'#ddffdd'
                               }}, // green

     // cuisines...
     {matcher:/pasta|italy|italian/i, color: {bg:'#ce2b37',fg:'#fedeed'}},
     {matcher:/india/i, color: {bg:'#FEB200',fg:'black'}}, // tumeric
     {matcher:/thai/i, color: {bg:'#f94b1e',fg:'#ffffce'}}, // red/orange
     {matcher:/china|chinese|asian/i, color: {bg:'#c51015',fg:'#F8D803'}}, // red/orange
     {matcher:/french|france/i, color: {bg:'#456990',fg:'#ffc501'}}, // queen blue
     {matcher:/mexic|spanish|spain/i, color: {bg:'#831E10',fg:'#ffdfdf'}}, // persimmon
     
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
