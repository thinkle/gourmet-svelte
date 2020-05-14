const defaultParsers = [
    {selector:'h1',tag:'title'},
    {selector:'.tag',tag:'category'},
    {selector:'.step',tag:'text',detail:'Instructions'},
    {selector:'.ingredient',tag:'ingredient'},
    {selector:'.ing',tag:'ingredient'},
];

const byDomain = {
    'cooking.nytimes.com':[
        {selector:'.recipe-title',tag:'title'},
        {selector:'.tag-block a',tag:'category'},
        {selector:'.byline',tag:'source'},
        {selector:'[itemProp="recipeYield"]',tag:'yield'},
        {selector:'.recipe-ingredients-wrap .part-name',tag:'inggroup'},
        {selector:'.quantity',tag:'amount'},
        {selector:'.ingredient-name',tag:'ingredient'},
        {selector:'[itemprop="recipeInstructions"]',tag:'text',detail:'Instructions'},
        {selector:'.recipe-notes',tag:'footnote'},
        {selector:'.topnote',tag:'text'},
        {selector:'.tag',tag:'category'},
        {selector:'',tag:''},
        {selector:'.recipe-yield-value',tag:'yield'},
        {selector:'.recipe-steps',tag:'text'},
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
        /* 
           <li class="recipe-yield-container">
                <span class="recipe-yield-time-label recipe-yield">Yield</span>
                <span class="recipe-yield-value">4 to 6 servings</span>
              </li>

        */
        {xpath:'//span@recipe-yield-time-label[text()[contains(.,"Yield")]/following-sibling:span',
         tag:'servings'},
        /*<span class="recipe-yield-time-label recipe-time">Time</span>*/
        {xpath:'//span@recipe-yield-time-label[text()[contains(.,"Time")]/following-sibling:span',
         tag:'time'}
    ],
}


function Parser (addTag) {
    var self = {
        
        auto_parse : function () {
            var domain = document.domain;
            var parsers = byDomain[domain]||defaultParsers;
            parsers.forEach((parser)=>{
                self.maybe_add(parser)
            });
        },
        
        maybe_add : function ({selector, tag, ignoreSlug, xpath,detail}) {
            if (xpath) {
                let results = document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null );
                var result = results.iterateNext();
                while (result) {
                    console.log('Tag',result,tag,detail)
                    addTag(result,tag,detail);
                    result = results.iterateNext();
                }
            }
            if (selector) {
                document.querySelectorAll(selector).forEach(function (el) {
                    console.log('Tag',el,tag,detail)
                    addTag(el,tag,detail);
                });
            }
        }
    }
    return self;
}

export default Parser;
