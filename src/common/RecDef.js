/* Useful metadata for recipes 

For each property type, we have:
 {name: ,
  label: , // what we show users
  toString: , // how to get a simple string view of it
  editType: , // the edit types...
*/

import Units from '../utils/units.js';

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
        {name:'title',
         label:'Title'},
        {name:'ingredients',
         label:'Ingredient List',
        },
        {name:'time',
         label:'Time',
         hasDetail:true,
        },
        {name:'text',
         label:'Text',
         hasDetail:true,
        },
        {name:'recipe',
         label:'Recipe (whole thing)',
        },
        {name:'ingredient',
         label:'Ingredient (Complete)',
        },
        {name:'ingredientText',
         label:'Ingredient Item',
        },
        {name:'inggroup',
         label:'Ingredient Group',
        },
        {name:'yields',
         label:'Yields',
         hasDetail:true,
        },
        {name:'time',
         label:'Time',
         hasDetail:true,
        },
        {name:'source',
         label:'Source'},
        {name:'category',
         label:'Category'},
        {name:'amount',
         label:'Ingredient Amount'},
        {name:'unit',
         label:'Ingredient Unit'},
        {name:'image',
         label:'Image'},
    ],
    ingProps : [
        {name:'ingkey',
         label:'Ingredient (key)',
         edit:CMB,
         testValue:'sugar, granulated',
         options:['Sugar','Flour','Water','Garlic','Carrot']
        },
        {name:'text',
         label:'Ingredient Item & Prep',
         edit:TXT,
         testValue:'granulated sugar, divided',
        },
        {name:'amount',label:'Amount',
         edtit:NUMUNIT,
         multipliable:true,
         testValue:{
             amount:1,
             unit:'cup'
         }},
        {name:'amount.unit',label:'Unit',
         edit:CMB,options:['cup','tsp','Tbs','l','ml','g','oz','quart','lb'],
         testValue:'cup',
        },
        {name:'amount.amount',
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
         toHtml:(s)=>s.trim(),
        },
    ],
    idProps : [
        {name:'id',purpose:'indexedDB'},
        {name:'localid',purpose:'import/export'},
        {name:'_id',purpose:'mongoDB'}
    ],
    recProps : [
        {name:'yields',
	 label:'Yield',
         edit:NUMUNIT,
         array:true,
         empty : [{}],
         testValue:[{amount:4,unit:'servings'}],
	 toHtml:(s)=>`${s.amount} ${s.unit}`,
        },
        // {name:'image',
        //  label:'image',
        //  edit:IMG},
        // {name:'yield.unit',
        //  label:'Yield unit',
        //  testValue:'servings',
        //  edit:CMB,options:['servings','cups']},
        // {name:'yield.amount',
        //  label:'Yield amount',
        //  testValue:3.25,
        //  edit:NUM,},
	{name:'categories',
	 label:'Categories',
         edit:MCMB,
         summaryView:true,
         options:['Dessert','Entree','Salad','Soup'],
         empty:[{name:''}],
         testValue:[{name:'Dessert'}],
	 toHtml:(s)=>s&&s.map((v)=>v.name).join(', '),
        },
	{name:'sources',
	 label:'Source',
         summaryView:true,
         testValue:{url:'http://tomhinkle.net/',name:'Fake Source'},
	 toHtml:(s)=>s&&s.url&&`<span><a href=${s.url}>${s.name||s.url.substr(0,30)}</a></span>`||s.name||'',
         empty:[{name:'',url:''}],
         array:true,
         edit:LNK,
        },
	{name:'times',
	 label:'Time',
         array:true,
         summaryView:true,
         testValue:{seconds:4250},
	 toHtml:(s)=>`${s.name}: ${s.text||Units.secondsToTimeString(s.seconds)||''}`,
         empty:[{name:'',seconds:0}],
         edit:DUR,
        },
        {name:'text',
         label:'text',
         array:true,
         summaryView:false,
         testValue:[{header:'Instructions',body:'This is a bunch of <b>text</b'}],
         toHtml:(s)=>s,
         empty:[],
         edit:RCH}
    ],
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

Metadata.importPropsByName = {}
for (let p of Metadata.importProps) {
    Metadata.importPropsByName[p.name] = p;
}

export default Metadata;
