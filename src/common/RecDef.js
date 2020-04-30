/* Useful metadata for recipes 

For each property type, we have:
 {name: ,
  label: , // what we show users
  toString: , // how to get a simple string view of it
  editType: , // the edit types...
*/

import Units from '../utils/Units.js';

var TXT = 'text';
var RCH = 'richText';
var NUM = 'number';
var CMB = 'combo';
var MCMB = 'multicombo';
var IMG = 'img';
var DUR = 'duration';
var LNK = 'link';
var NUMUNIT = 'numunit';

var EditTypes = [
    CMB,
    TXT,
    RCH,
    NUM,
    IMG,
    DUR,
    MCMB,
    LNK,
    NUMUNIT,
    ]

var Metadata = {
    importProps : [
        {name:'ingredients',
         label:'Ingredients',
         edit:RCH,
        },
        {name:'recipe',
         label:'Recipe (whole thing)',
         edit:RCH,
        },
        {name:'ingredient',
         label:'Ingredient',
         edit:TXT,},
        {name:'inggroup',
         label:'Ingredient Group',
         edit:TXT},
    ],
    ingProps : [
        {name:'ingkey',
         label:'Ingredient (key)',
         edit:CMB,
         testValue:'sugar, granulated',
         options:['Sugar','Flour','Water','Garlic','Carrot']
        },
        {name:'item',
         label:'Ingredient Item & Prep',
         edit:TXT,
         testValue:'granulated sugar, divided',
        },
        {name:'unit',label:'Unit',
         edit:CMB,options:['cup','tsp','Tbs','l','ml','g','oz','quart','lb'],
         testValue:'cup',
        },
        {name:'amount',
         label:'Amount',
         edit:NUM,
         testValue:'3 1/2',
        },
    ],
    titleProps : [
        {name:'title',
         label:'Title',
         edit:TXT,
         testValue:'A Very Fine Recipe Indeed',
         toPlainString:(s)=>s.trim(),
        },
    ],
    recProps : [
        {name:'yield',
	 label:'Yield',
         edit:NUMUNIT,
         testValue:{amount:4,unit:'servings'},
	 toPlainString:(s)=>`${s.amount} ${s.unit}`
        },
        {name:'image',
         label:'image',
         edit:IMG},
        {name:'yield.unit',
         label:'Yield unit',
         testValue:'servings',
         edit:CMB,options:['servings','cups']},
        {name:'yield.amount',
         label:'Yield amount',
         testValue:3.25,
         edit:NUM,},
	{name:'category',
	 label:'Categories',
         edit:MCMB,
         options:['Dessert','Entree','Salad','Soup'],
         testValue:['Dessert'],
	 toPlainString:(s)=>s&&s.join(', '),
        },
	{name:'source',
	 label:'Source',
         testValue:{url:'http://tomhinkle.net/',name:'Fake Source'},
	 toPlainString:(s)=>s&&<span><a href={s.url}>{s.name}</a></span>,
         edit:LNK,
        },
	{name:'preptime',
	 label:'Prep Time',
         testValue:4250,
	 toPlainString:(s)=>Units.secondsToTimeString(s),
         edit:DUR,
        },
	{name:'cooktime',
	 label:'Time to Cook',
         testValue:14250,
	 toPlainString:(s)=>Units.secondsToTimeString(s),
         edit:DUR,
        },
	{name:'totaltime',
	 label:'Total Time',
         testValue:24250,
	 toPlainString:(s)=>JSON.stringify(s),
         edit:DUR,
        },
    ],
    recBlocks : [
	{name:'headnote',
	 label:'Headnote',
         edit:RCH,
	},
	{name:'steps',
	 label:'Steps',
         edit:RCH,
	},
	{name:'instructions',
	 label:'Instructions',
         edit:RCH,
	},
	{name:'modifications',
	 label:'Modifications',
         edit:RCH,
	},
	{name:'footnote',
	 label:'Footnote',
         edit:RCH,
	},
    ]
};

// Make a handy lookup...
var byProp = {};
for (var key in Metadata) {
    var props = Metadata[key]
    props.forEach(
        (p)=>{
            p.propType = key;
            byProp[p.name] = p;
        });
}

Metadata.byProp = byProp
Metadata.EditModes = {
    TXT,
    RCH,
    NUM,
    CMB,
    MCMB,
    IMG,
    DUR,
    LNK,
    NUMUNIT,
}

export default Metadata;
