import {contentParsePage} from '../messaging/parsing.js';
import {recipeSchemaSelector,importer} from './recipeSchema.js'

const defaultParsers = [
    {selector:'h1',tag:'title'},
    {selector:'.tag',tag:'category'},
    {selector:'.step',tag:'text',detail:'Instructions'},
    {selector:'.ingredient',tag:'ingredient'},
    {selector:'.ing',tag:'ingredient'},
];

const bySelector = {
    [recipeSchemaSelector] : importer,    
}

const byDomain = {
    'cooking.nytimes.com':[
        /* 
           <li class="recipe-yield-container">
                <span class="recipe-yield-time-label recipe-yield">Yield</span>
                <span class="recipe-yield-value">4 to 6 servings</span>
              </li>

        */
        {xpath:"//span[contains(@class, 'recipe-yield-time-label')]/text()[contains(.,'Yield')]/parent::span/following-sibling::span",
         tag:'yields'},
        /*<span class="recipe-yield-time-label recipe-time">Time</span>*/
        {xpath:"//span[contains(@class, 'recipe-yield-time-label')]/text()[contains(.,'Time')]/parent::span/following-sibling::span",
         tag:'time'},
        //{selector:'.recipe-yield-value',tag:'yield'},
        {selector:'.recipe-title',tag:'title'},
        {selector:'.tag-block a',tag:'category'},
        {selector:'.byline',tag:'source'},
        {selector:'[itemProp="recipeYield"]',tag:'yield'},
        {selector:'.recipe-ingredients-wrap .part-name',tag:'inggroup'},
        {selector:'.recipe-ingredients li',tag:'ingredient'},
        {selector:'.ingredient-name',tag:'ingredientText'},
        {selector:'.quantity',tag:'amount'},
        {selector:'[itemprop="recipeInstructions"]',tag:'text',detail:'Instructions'},
        {selector:'.recipe-notes',tag:'footnote'},
        {selector:'.topnote',tag:'text'},
        {selector:'.tag',tag:'category'},
        {selector:'',tag:''},
        {selector:'.recipe-steps',tag:'text'},
        {selector:'.recipe-intro .media-container',tag:'image'},
        {selector:'[itemprop="image"]',tag:'image'}, // fix me
    ],
    'www.cooksillustrated.com':[
        {selector:'.detail__header--text',
         tag:'title'},
        {selector:'h2.document-header__title',
         tag:'title'},
        {selector:'h2[name=title]',
         tag:'title'},
        {selector:'.ingredients',
         tag:'ingredients'},
        {selector:'.ingredients h5',
         tag:'inggroup'},
        {selector:'.recipe__ingredient--header',
         tag:'inggroup'},
        {selector:'.recipe__ingredient--quantity',
         tag:'amount'},
        {selector:'.recipe__ingredient--detail',
         tag:'ingredient'},
        {selector:'div.long',
         tag:'footnote'},
        {selector:'section.asides',
         tag:'text',detail:'Notes'},
        {selector:'section.recipe-instructions',
         tag:'text',detail:'Instructions'},
        {selector:'.recipe-instructions__yield',
         tag:'yield'},
        {selector:'.serves',
         tag:'yield: Servings'},
        {selector:'.recipe__yield',
         tag:'yield'},
        {selector:'#recipe_intro .detail__content',
         tag:'text',detail:'Headnote'},
        {selector:'#recipe_intro .detail__content',
         tag:'text',detail:'Headnote'},
        {selector:'.recipe__instructions--content',
         tag:'text',detail:'Instructions'},
        {selector:'.asides',
         tag:'text',detail:'Footnote'},
    ],
}


function Parser (addTag) {
    var self = {
        
        getParserBySelector () {
            for (let selector in bySelector) {
                if (document.querySelector(selector)) {
                    return bySelector[selector]
                }
            }
        },

        auto_parse : function () {
            self.results = [];
            var domain = document.domain;
            let parsers;
            if (byDomain[domain]) {
                parsers = byDomain[domain]
                console.log('Got custom parser for domain');
            }
            else {
                parsers = self.getParserBySelector();
                if (parsers) {
                    console.log("Got parser by selector!");
                }
            }
            if (!parsers) {
                parsers = defaultParsers
            }
            parsers.forEach((parser)=>{
                self.maybe_add(parser)
            });
            return self.results
        },
        
        maybe_add : function ({selector, tag, ignoreSlug, xpath,detail}) {
            // Make a list of elements, then move through them -- we can't iterate through xpath results
            // and change the document as we go.
            if (xpath) {
                let iterator = document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null );
                var result = iterator.iterateNext();
                let results = []
                while (result) {
                    results.push(result)
                    result = iterator.iterateNext();
                }
                for (let result of results) {
                    console.log('Tag',result,tag,detail)
                    self.results.push(
                            addTag(result,tag,undefined,detail)
                    );
                }
            }
            if (selector) {
                document.querySelectorAll(selector).forEach(function (el) {
                    console.log('Tag',el,tag,detail)
                    self.results.push(
                        addTag(el,tag,undefined,detail)
                    );
                });
            }
        },

    }

    self.listen = ()=>{contentParsePage.receive(() => self.auto_parse());}
    
    return self;
}

export default Parser;
