import $ from 'jquery';

const defaultParsers = [
    {el:'h1',tag:'title'},
    {el:'.tag',tag:'category'},
    {el:'.step',tag:'instructions'},
    {el:'.ingredient',tag:'ingredient'},
    {el:'.ing',tag:'ingredient'},
];

const byDomain = {
    'cooking.nytimes.com':[
        {el:'.recipe-title',tag:'title'},
        {el:'.tag-block a',tag:'category'},
        {el:'.byline',tag:'source'},
        {el:'[itemProp="recipeYield"]',tag:'yield'},
        {el:'.recipe-ingredients-wrap .part-name',tag:'inggroup'},
        {el:'.quantity',tag:'amount'},
        {el:'.ingredient-name',tag:'ingredient'},
        {el:'[itemprop="recipeInstructions"]',tag:'instructions'},
        {el:'.recipe-notes',tag:'footnote'},
        {el:'.topnote',tag:'headnote'},
        {el:'[itemprop="image"]',tag:'image'}, // fix me
    ],
    'www.cooksillustrated.com':[
        {el:'.detail__header--text',
         tag:'title'},
        {el:'h2.document-header__title',
         tag:'title'},
        {el:'h2[name=title]',
         tag:'title'},
        {el:'.ingredients',
         tag:'ingredients'},
        {el:'.ingredients h5',
         tag:'inggroup'},
        {el:'.recipe__ingredient--header',
         tag:'inggroup'},
        {el:'.recipe__ingredient--quantity',
         tag:'amount'},
        {el:'.recipe__ingredient--detail',
         tag:'ingredient'},
        {el:'div.long',
         tag:'footnote'},
        {el:'section.asides',
         tag:'modifications'},
        {el:'section.recipe-instructions',
         tag:'instructions'},
        {el:'.recipe-instructions__yield',
         tag:'yield'},
        {el:'.serves',
         tag:'yield'},
        {el:'.recipe__yield',
         tag:'yield'},
        {el:'#recipe_intro .detail__content',
         tag:'headnote'},
        {el:'#recipe_intro .detail__content',
         tag:'headnote'},
        {el:'.recipe__instructions--content',
         tag:'instructions'},
        {el:'.asides',
         tag:'footnote'},
    ],
}


function Parser (addTag) {
    console.log("CREATED PARSER WITH addTag=",addTag);
    var self = {
        
        auto_parse : function () {
            var domain = document.domain;
            var parsers = byDomain[domain]||defaultParsers;
            parsers.forEach((parser)=>{
                self.maybe_add(parser.el,parser.tag)
            });
        },
        
        maybe_add : function (selector, tag, ignoreSlug) {
            console.log('maybe_add checking %s = %s',selector,tag)
            $(selector).each(function (el) {
                console.log('Add %s to %s',tag,this);
                addTag(this,tag);
            });
        }
    }
    return self;
}

export default Parser;
