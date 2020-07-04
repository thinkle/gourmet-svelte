/* Useful metadata for recipes 

For each property type, we have:
 {name: ,
  label: , // what we show users
  toString: , // how to get a simple string view of it
  editType: , // the edit types...
*/

import Units from '../utils/units.js';

const TXT = 'text';
const RCH = 'richText';
const NUM = 'number';
const CMB = 'combo';
const MCMB = 'multicombo';
const IMG = 'img';
const DUR = 'duration';
const LNK = 'link';
const STAR = 'stars';
const NUMUNIT = 'numunit';

const Metadata = {
    importProps : [
        {name:'title',
         label:'Title',
        },
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
         nullValueText:'Timeless'
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
         nullValueText:'Untitled',
         edit:TXT,
         testValue:'A Very Fine Recipe Indeed',
         isTitle:true,
         toHtml:(s)=>s.trim(),
        },
    ],
    idProps : [
        {name:'id',purpose:'indexedDB'},
        {name:'localid',purpose:'import/export'},
        {name:'_id',purpose:'mongoDB'}
    ],
    recProps : [
        {name:'images',
         label:'Image',
         edit:IMG,
         hideLabel:true,
         array:true,
         empty:{url:''},
         testValue:[{url:''}],
         isNull:(v)=>!v||!v.url,
         toHtml:(i)=>`<img style="max-width:${i.width+'px'||''}" src="${i.url}">`,
         match:(v1,v2)=>v1.url==v2.url,
        },
        {name:'yields',
	 label:'Yield',
         edit:NUMUNIT,
         array:true,
         empty : {},
         isNull:(v)=>!v||!(v.amount||v.unit),
         testValue:[{amount:4,unit:'servings'}],
	 toHtml:(s)=>`${s.amount} ${s.unit}`,
         match:(v1,v2)=>v1.unit==v2.unit&&v1.amount==v2.amount,
        },
	{name:'categories',
	 label:'Categories',
         edit:MCMB,
         summaryView:true,
         displayAsTag:true,
         options:[{name:'Dessert'},{name:'Entree'},{name:'Salad'},{name:'Soup'}],
         empty:{name:''},
         isNull:(v)=>!v||!v.name,
         testValue:[{name:'Dessert'}],
	 toHtml:(v)=>v.name,
         array:true,
         nullValueText:'Uncategorized',
         match:(v1,v2)=>v1.name==v2.name,

        },
	{name:'sources',
	 label:'Source',
         summaryView:true,
         testValue:{url:'http://tomhinkle.net/',name:'Fake Source'},
	 toHtml:(s)=>s&&s.url&&`<span><a target="_blank" href=${s.url}>${s.name||s.url.substr(0,30)}</a></span>`||s.name||'',
         empty:{name:'',url:''},
         isNull:(v)=>!v||!v.name,
         array:true,
         minEditWidth: 400,
         edit:LNK,
         match : (v1,v2)=>v1.name==v2.name,
        },
        {name:'rating',
         label:'Rating',
         hideLabel:true,
         summaryView:true,
         array:false,
         testValue:5,
         isNull:(v)=>!v,
         edit:STAR,
         display:STAR,
         match : (v1,v2)=>v1==v2,
         toHtml:(v)=>`${v} of 5 stars`,
        },
	{name:'times',
	 label:'Time',
         displayAsTag:false,
         array:true,
         testValue:{seconds:4250},
	 toHtml:(s)=>`${s.name}: ${s.text||Units.secondsToTimeString(s.seconds)||''}`,
         empty:{name:'',seconds:0},
         isNull:(v)=>!v||!(v.name||v.text||v.seconds),
         edit:DUR,
         match : (v1,v2)=>v1.seconds==v2.seconds && !v1.text||!v2.text||v1.text==v2.text,
         minEditWidth: 415,
        },
        {name:'text',
         label:'Text',
         bottom:true,
         hideLabel:true,
         array:true,
         summaryView:false,
         testValue:[{header:'Instructions',body:'This is a bunch of <b>text</b'}],
         toHtml:(s)=>s.header&&`<h3>${s.header}</h3>\n${s.body}`||s.body,
         empty:{body:'',header:''},
         isNull:(v)=>!v||!(v.body||v.header),
         edit:RCH,
         match : (v1,v2)=>v1.body.match(v2.body)||v2.body.match(v1.body),
         minEditWidth : 600,
        }
    ],
};

// Make a handy lookup...
const byProp = {};
for (let key in Metadata) {
    const props = Metadata[key]
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
    STAR,
}

Metadata.importPropsByName = {}
for (let p of Metadata.importProps) {
    Metadata.importPropsByName[p.name] = p;
}

export default Metadata;
