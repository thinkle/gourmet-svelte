// Attempt to guess some stuff...

function getClasses () {
    let documentClasses = []
    document.querySelectorAll('[class]').forEach(
        (n)=>{
            for (let klass of n.classList.values()) {
                if (documentClasses.indexOf(klass)==-1) {
                    documentClasses.push(klass)
                }
            }
        }
    );
    return documentClasses;
}


// Order matters here: once a class is matched, it is not matched a second time
let generatorDef = [
    {
        classMatcher : /\bingr(edient).*gro?u?p/i,
        tag : 'inggroup'
    },
    {
        classMatcher : /\bingr(edient).*amo?u?n??t/i,
        tag : 'amount'
    },
    {
        classMatcher : /\bingr(edient).*uni?t/i,
        tag : 'unit'
    },
    {
        classMatcher : /\bingr(edient)s/i,
        tag : 'ingredients'
    },
    {
        classMatcher : /\bingr?e?d?i?e?n?t?/i,
        tag : 'ingredients'
    },
    {
        classMatcher : /cuisine|recipe.*category|recipe.*tag/,
        tag : 'category'
    },
    {
        classMatcher : /instruction|direction|step/,
        tag : 'text'
    },
    {
        classMatcher : /byline|rec.*author|rec.*source/,
        tag : 'source'
    },
    {
        classMatcher : /\bserv|yield/,
        tag : 'yields'
    },
    {
        classMatcher : /time/,
        tag : 'time'
    },
    {
        classMatcher : /rec.*title/i,
        tag : 'title',
    },
    {
        classMatcher : /rec(ipe)?/,
        tag : 'recipe',
        submatchers : [
            { classMatcher : /\btxt|\btext/,
              tag : 'text'},
            { classMatcher : /img|media|image/,
              tag : 'image' },
            {
                classMatcher : /category/,
                tag : 'category'
    },

        ]
    }

];

export function generateParser (defs=generatorDef) {
    let classes = getClasses();
    console.log('Generating parsers for ',classes.length,'possible classes');
    let alreadyMatched = [];
    let parsers = [
        {selector:'script[type="application/ld+json"]',
         tag:'ld+json'}
    ];
    for (let def of defs) {
        generateParseItem(def)
    }
    console.log('Generated parser!',parsers);
    return parsers;

    function generateParseItem ({classMatcher, tag, detail, submatchers}, parentMatcher='') {
        if (!tag) {
            throw ('No tag!',classMatcher,detail)
        }
        if (!classMatcher) {
            throw ('No matcher!',classMatcher,tag,detail);
        }
        for (let klass of classes) {
            // Enforce only one match per class
            if (!submatchers && alreadyMatched.indexOf(klass)==-1 && klass.match(classMatcher)) {
                parsers.push({selector:parentMatcher+'.'+klass,
                              tag,detail});
                alreadyMatched.push(klass);
            }
            if (submatchers) {
                for (let m of submatchers) {
                    generateParseItem(m,parentMatcher+' .'+klass)
                }
            }
        }
    }


}
