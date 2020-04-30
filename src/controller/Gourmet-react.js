// CouchDB stuff here.


// NOTE TO SELF - we got halfway to transitioning to PouchDB but that seems to be a mess...

// NEVERMIND - PouchDB is a dead end for a standalone chrome
// extension, because the map/reduce logic all relies on eval and
// chrome disallows eval because chrome extensions have too much power
// to allow unsafe eval.
// See
// https://github.com/evidenceprime/pouchdb.mapreduce.noeval for an
// example of a workaround that seems to suck too much to be worth our time.
//
// Next step: Isolate the chrome extension part of our app more dramatically.
// If we count on Gourmet being a web app which uses local browser storage, then
// our chrome extension can route all our real information to the web app which will
// store the local info via pouch and sync to a cloud account as needed.
//
// The new world order...
//
import {observable, autorun, action, computed} from 'mobx';
//import React from 'react';
import nano from 'nano';
import pouchdbDebug from 'pouchdb-debug';
import PouchDB from 'pouchdb';
import PouchDbFind from 'pouchdb-find';
PouchDB.plugin(pouchdbDebug);
PouchDB.plugin(PouchDbFind)
//PouchDB.debug.enable('*');

//import db from './backend.js';
import {float_to_frac} from '../utils/Numbers.js';
import Units from '../utils/Units.js';
import Metadata from './RecDef.js'

// Database code...
//var couch = new PouchDB('gourmetdb');
var pouch, couch, rdb, pouchCouch;
var views, authenticated;

const NotConnectedError = Error("Not connected to remote CouchDB");

function connectToPouch () {
    var pouchName = 'recipe';
    pouch = new PouchDB(pouchName);
    //pouchCouch = pouch;
    //couch = pouch;
    rdb = undefined;
}

function connectToCouch ({username='', password='', url="db.gourmetrecipemanager.com"}) {
    var couchUrl = `https://${username}:${password}@${url}/`;
    console.log('Connect to Couch: url=%s/recipes',couchUrl);
    pouchCouch = new PouchDB(couchUrl+'recipes');
}

function replicateToRemote () {
    if (!pouchCouch) {
        throw NotConnectedError;
    }
    console.log('Fire off replicate TO remote');
    pouchCouch.replicate.from(pouch)
        .on('complete',()=>{console.log('Completed copy to remote');})
        .on('change',(a)=>{console.log('Replication change fire: %s',a)})
        .on('error',(e)=>{console.log('Error copying to remote: %s',e);});
}

function replicateFromRemote () {
    console.log('Fire off replicate from remote');
    if (!pouchCouch) {
        throw NotConnectedError;
    }
    pouch.replicate.from(pouchCouch,{live:true,retry:true})
        .on('complete',()=>{console.log('Completed copy from remote');})
        .on('change',(a)=>{console.log('Replication change fire: %s',a)})
        .on('denied',(a)=>{console.log('Replication denied fire: %s',a)})
        .on('active',(a)=>{console.log('Replication active fire: %s',a)})
        .on('error',(e)=>{console.log('Error copying from remote: %s',e);});

}

function setupAnew (
    //couchUrl = 'http://admin:password@localhost:5984/',
    couchUrl = SECRET,
    couchDB = 'recipes',
    pouchName = 'test') {
    pouch = new PouchDB(pouchName);
    pouch.on('error',function () {debugger});
    store.__pouch = pouch;
    return new Promise(function (resolve, reject) {
        try {
            couch = nano(couchUrl);
            rdb = couch.db.use(couchDB);
            pouchCouch = new PouchDB(couchUrl+couchDB);
        }
        catch (err) {
            console.log('Not finding remote');
        }
        pouchCouch.replicate.from(pouch)
            .on('complete',
                ()=>{console.log('pouch=>couch')}
            )
            .on('error',
                (e)=>{console.log('pouch=>couch ERROR :( %s',JSON.stringify(e))}
               );
        pouch.replicate.from(pouchCouch).on(
            'complete',
            ()=>{
                authenticated = true;
                views = setupViews();
                resolve();
            })
            .on('error',(e)=>{
                console.log('Pouch error replicating from couch: %s',JSON.stringify(e));
                window.pouchError = e;
                window.PouchDB = PouchDB;
            });
    });
}

function connectToDB (
    //couchUrl = 'https://admin:password@localhost:5984/',
    couchUrl = SECRET,
    couchDB = 'recipes',
    pouchName = 'test') {
    console.log('connectToDB POUCH!');
    //pouchName = 'recipes') {
    return new Promise(function (resolve, reject) {
        pouch = new PouchDB(pouchName);
        store.__pouch = pouch;
        pouchCouch = new PouchDB(couchUrl+couchDB);
        store.__pouchCouch = pouchCouch
        resolve();
    });
}

// try {
//     //console.log('try to replicate from couch');
//     pouch.replicate.from(pouchCouch); // copy our DB?
//     //console.log('Replicated to pouch');
// }
// catch (err) {
//     console.log('Err? %s',err);
// }

//couch.db.use('recipes');

// Another approach, perhaps? What if we set up indexes instead of views.
// This is probably not worth it -- I had been thinking this would be an alternative to map/reduce
// and a way to use this in a chrome plugin. But then, do I really want that anyway? And, more to
// the point, it turns out querying against these is a pain -- the idea is really quite different than
// the idea with map/reduce. This is just a way to do exact searches, so if I wanted to do e.g. a keyword
// search, I'd have to reproduce all the complexity of the index once again in the search (search for
// recipes where title OR category  OR source = keyword... which seems, coding-wise, like a pain).
function setupIndexes () {
    var indices = [
        // keyword, fields
        {name:'keyword',fields:['title','categories','source.name']},
        {name:'ingredient',fields:['ingredients.item','ingredients.ingkey','ingredients.inggroup']},
        {name:'fulltext',fields:['title','ingredients.item','ingredients.ingkey','categories','source.name','source.url','instructions','modifications']}
    ]
    indices.forEach((ind)=>{
        pouch.createIndex({
            index : ind
        }
                         )
            .then((r)=>console.log('Created index %s',ind.name));
    });
}

function setupViews () {
    var fields = `{title:doc.title,
 	      thumb:doc.thumb,
	      categories:doc.categories,
	      source:doc.source}`

    var functions = `var emitted = [];
                  function emitWord (w) { 
                     if (w && w.toLowerCase) {
                        w = w.toLowerCase();
                        if (emitted.indexOf(w)==-1) {
                           emit(w,${fields})
                           emitted.push(w);
                        }
                     }
                  }
                  function emitWords (t) { t && t.split && t.split(/\\W+/).forEach(emitWord)}
                  function emitAll (t) {emitWord(t); emitWords(t)}
    `

    var views = [
	{map : `function (doc) { ${functions}
                     emitAll(doc.title);
                     doc.categories.forEach((c)=>{emitAll(c)});
                     emitAll(doc.source);
                 }`,
         search: 'keyword',
         name : '_design/keyword'
        },
	{map:`function(doc) { ${functions} 
                   emitAll(doc.title);
               }`,
	 search:'title',
	 name:'_design/recipes'},

	{map:`function (doc) {
          ${functions}
	 doc.categories.forEach(function(c){
	     emitAll(c);
	 });
     }`,
	 name:'_design/categories',
	 search:'categories'
	},

	{map:`function (doc) {
         ${functions}
	 doc.ingredients.forEach(function(i){
	     emitAll(i.item)
             if (i.ingkey != i.item) {
               emitAll(i.ingkey)
             }
             i.ingkey && i.ingkey.split && i.ingkey.split(/\\W+/).forEach(emitWord);
	 })
     }`,
         search : 'ingredients',
	 name:'_design/ingredients'},
	
	{name:'_design/rec_fulltext',
	 map:`function (doc) {
                  ${functions}

                  doc.categories.forEach(emitWord);
		  doc.ingredients.forEach(function (i) {
	            emitAll(i.item);
		    if (i.ingkey!=i.item) {
            	      emitAll(i.item);
                    }
		  });
		  doc.steps && doc.steps.forEach(emitAll);
                  emitWord(doc.source && doc.source.text);
		  emitWords(doc.modifications);
		  emitWords(doc.instructions);
                  emitAll(doc.title);
              }`,
	 search:'fulltext',
        },
    ]


    
    // Build one viewDoc with all the views
    // var viewDoc = {
    //     _id : '_design/gindex',
    //     views : {}
    // }
    // views.forEach((v)=>{
    //     viewDoc.views[v.search] = v.map
    // });
    // pouch.get('_design/gindex',(error,response)=>{
    //     if (response) {
    //         viewDoc._rev = response._rev; // clobber what is there if it is there
    //         console.log('Updating existing response - was rev %s',response._rev);
    //     }
    //     // Regardless, push our views...
    //     pouch.put(viewDoc)// push!
    //         .then(()=>{
    //             console.log('Done pushing view');
    //             views.forEach((v)=>{
    //                 console.log('index %s',v.search);
    //                 pouch.query(`gindex/${v.search}`,{stale:'update_after'})
    //                     .then(()=>{console.log('Done indexing %s',v.search)})
    //                 ;
    //             });
    //         });
    // });

    // return views;

    // Build one design doc per view...
    views.forEach((v)=>{

        var viewDoc = {
            _id : `_design/${v.search}`,
            views : {
            }
        }
        viewDoc.views[v.search] = {map:v.map};
	// rdb.get(v.name, (error, response) => {
	//     if (response) {
        //         console.log('Got view %s - already existing',v);
	// 	viewDoc._rev = response._rev;
	//     }
        //     console.log('Insert new viewdoc/name %s',v.name);
        //     console.log('View doc looks like this: %s',JSON.stringify(viewDoc));
	//     rdb.insert(viewDoc,
	// 	       v.name,
	// 	       function (error, response) {
	// 		   console.log("yay %s %s",error,response);
	// 	       }
	// 	      );
        // });
        // Pouch version? See
        // https://pouchdb.com/2014/05/01/secondary-indexes-have-landed-in-pouchdb.html

        function pushDoc () {
            pouch.put(viewDoc)
                    .then(()=>{
                        console.log('build index for %s',v.search);
                        pouch.query(v.search,{stale:'update_after'});
                    })
                    .then(
                        ()=>{
                            console.log('Indexing done for %s',v.search)
                        }
                    );
        }

        pouch.get(viewDoc._id)
            .then( (response)=>{
                if (response) {
                    console.log('View %s exists: update rev info!%s',viewDoc._id,response._rev);
                    viewDoc._rev = response._rev; 
                }
                //console.log("Let's push our viewDoc");
                pushDoc()
            })
            .catch((err)=>{
                //console.log('ERR CREATING VIEW %s: %s',viewDoc._id,err);
                console.log(JSON.stringify(err));
                if (err.name =='not_found') {
                    pushDoc()
                }
            });
    
    }); // end for each view...
    return views;
}

//console.log('Set up views?');
//var views = setupViews();
//setupIndexes(); // nevermind
//console.log('Loading Gourmet.js');
//var authenticated = true;
// couch.auth('admin', 'password',(err, response, headers) => {
//     console.log('Authenticated %s %s',response,headers);
//     authenticated = true;
//     couch = nano({
//         url: 'http://localhost:5984',
// 	cors : true,
//         cookie: headers['set-cookie']
//     });
// });

/*function doNano () {
    var nano = require('nano')('http://localhost:5984');
}*/

// "Controller" layer -- this is the "store" code that will
// handle interactions between our React views and our CouchDB model

class ShoppingList {
    
    @observable recipes = [];
    @observable items = [];
    
    
}

class CurrentRecipe {
    
    @observable multiplier = 1;
    //@observable recipe_id = 1;
    @observable origRecipe = {
    };
    

    @computed get ingredients () {

	return this.origRecipe && this.origRecipe.ingredients && this.origRecipe.ingredients.map(
	    (i) => {
		i.extendedAmount = i.amount*this.multiplier;
		i.displayAmount = i.amount && float_to_frac(i.extendedAmount) || '';
		//console.log('Set displayAmount=>',i.displayAmount);
		return i;
	    }
	);
    };

    @computed get recipe () {
	if (this.origRecipe && this.origRecipe['yield'] && this.origRecipe['yield'].amount) {
            console.log('Multiply yield! %s %s',this.origRecipe['yield'].amount,float_to_frac(this.origRecipe['yield'].amount * this.multiplier))
	    return {
		...this.origRecipe,
		ingredients : this.ingredients,
		'yield' : {
                    ...this.origRecipe['yield'],
                    amount:float_to_frac(this.origRecipe['yield'].amount * this.multiplier)
                }
            }
	}
        else if (this.origRecipe) {
            return {
                ...this.origRecipe,
                ingredients : this.ingredients
            }
        }
	else {
	    return {}
	}
    }
	

    @action updateRecipe (changes) {
        var updatedRecipe = {...this.origRecipe,
                             ...changes};
        return new Promise (function (resolve, reject) {
            pouch.put(updatedRecipe)
                .then(()=>{
                    console.log('Successfully pushed recipe object %s',JSON.stringify(updatedRecipe));
                    resolve(updatedRecipe);
                })
                .catch((err)=>{
                    console.log('Error updating recipe: %s',err);
                    reject(err);
                })
        });
    }

    @action clearRecipe () {
        this.rid = undefined;
        this.origRecipe = {}
    }

    @action setRecipe (id) {
	//console.log('setRecipe %s',id);
        return new Promise((resolve,reject)=>{
	    this.rid = id;
	    pouch.get(id)
                .then((body)=>{
	            this.setMultiplier(1);
	            this.origRecipe = {...body, id:id}
                    console.log('set recipe successful %s!',id);
                    resolve(this.origRecipe);
                })
                .catch(reject())
        });
    }

    @action setMultiplier (n) {
	this.multiplier = n;
    }

}

class RecipeStore {

    @observable recipes = [];

    // Selection handlers (allow us to have "selected" recipes...)
    @observable selectedRecipes = [];
    
    @action toggleRecipeSelected (r) {
        if (this.selectedRecipes.indexOf(r.id) > -1) {
            //console.log('Select %s',r.id)
            this.unselectRecipe(r)
        }
        else {
            //console.log('Unselect %s',r.id)
            this.selectRecipe(r)
        }
    }

    @action selectRecipe (r) {
        //console.log('Select recipe %s',r.id);
        this.selectedRecipes.push(r.id);
    }
    @action unselectRecipe (r) {
        this.selectedRecipes.splice(this.selectedRecipes.indexOf(r.id),1); // remove item
    }
    @action clearSelectedRecipes () {
        this.selectedRecipes = []
    }
    

    // Paging handlers...
    @observable pageNum = 1;
    @observable pageLen = 10;
    @computed get page () {
	return this.recipes.slice(this.pageLen*(this.pageNum-1),this.pageLen*this.pageNum)
    }

    @computed get lastPage () {
        return Math.ceil(this.recipes.length/this.pageLen)
    }
    

    @action pageUp () {if (this.pageNum < this.lastPage) {this.pageNum += 1}}
    @action pageDown () {if (this.pageNum > 1) {this.pageNum -= 1}}
    @action setPage (n) {this.pageNum = n}
    @action setPageSize (n) {this.pageLen=n; this.pageNum = 1}

    // Search handlers
    @observable search = {
	type : 'ingredients',
	text : ''
    }

    @action updateSearch (props, callback) {
        if (!this.search.type || !this.search.text) {
            return new Promise((resolve, reject)=>{
                pouch.allDocs({include_docs:true})
                    .then((b)=>{
                        console.log('Got all the recipes...');
                        this.updateRecipesFromView(b);
                        resolve(b)
                    })
                    .catch((e)=>{
                        this.handleError(e);
                        reject(e)
                    })
            });
        }
        //console.log('Update search!');
        this.pageNum = 1;
	//console.log('Update search got %s',JSON.stringify(props));
	Object.assign(this.search,props); // update search...
        //console.log('We are searching: %s',JSON.stringify(this.search))
        return new Promise((resolve,reject)=>{
            pouch.query(
                this.search.type,
	        {startkey:this.search.text.toLowerCase(),
                 endkey:this.search.text.toLowerCase()+'ZZZ'
                }
            )
                .then(
                    (body)=>{
                        this.updateRecipesFromView(body);
                        resolve(body);
                    }
                )
                .catch(
                    (e)=>{
                        this.handleError(e);
                        reject(e)
                    }
                );
	//rdb.view(this.search.type,'shortview',
	//{startkey:this.search.text.toLowerCase(),endkey:this.search.text.toLowerCase()+'ZZZ'},
	    //(e,b)=>this.updateRecipesFromView(e,b));
        });
    }



    // Basic recipe handlers...
    @action fetchRecs () {
        return new Promise((resolve,reject)=>{
	    if (!authenticated) {
	        console.log('fetchRecs... Wait a sec and try againb');
	        setTimeout(this.fetchRecs,500);
	        reject();
	    }

	    //console.log('Got rdb: %s',rdb);
            console.log('fetchRecs!!!');
	    //rdb.list({include_docs:true,fields:['title','thumb']},(err,body)=>{
	    //rdb.view('ingredients','shortview',{startkey:'chocolate',endkey:'chocolatf'},(err,body)=>{
	    //rdb.view('categories','shortview',{},(e,b)=>this.updateRecipesFromView(e,b));
            pouch.allDocs({  include_docs: true})
                .then((b)=>{
                    this.updateRecipesFromView(b);
                    resolve(b)
                })
                .catch((e)=>{
                    this.handleError(e);
                    reject(e);
                });
        });
    }

    handleError (err) {
	if (err) {console.log('ERROR ERROR: Got err %s',JSON.stringify(err));}
    }

    updateRecipesFromView (body) {
	var ids = []
	this.recipes = [] // blank out recipes...
	body.rows.forEach((r)=>{
	    //console.log('got rec %s',JSON.stringify(r));
	    if (ids.indexOf(r.id)==-1) {
                //console.log('push rec %s',JSON.stringify(r));
                if (r.doc) {
                    this.recipes.push({...r.doc, id:r.id});
                }
                else {
		    this.recipes.push({...r.value, id:r.id});
                }
		ids.push(r.id);
	    }
	});
    }
    
    create (document) {
        return new Promise((resolve,reject)=>{
            pouch.post(document).then((response)=>{
                if (response.ok) {
                    console.log('CREATED DOC: %s',JSON.stringify(response));
                    console.log('Now sync?');
                    pouchCouch.replicate.from(pouch)
                        .on('complete',()=>{console.log('pouch=>couch success')})
                        .on('error',(e)=>{console.log('boo hoo error on pouch replication: %s',e); debugger;});
                    resolve(response);
                }
            })           
                .catch(reject);
        });
    }

}

function createTestRecs () {
    window._store = store;
    window._pouch = pouch;
    store.recStore.create({
        title : 'zxcvasdf',
        servings : 4,
        yield: {
            amount : 4,
            unit : 'servings'
        },
        categories : [
            "Testducktest",
            "Dessert"
        ],
        preptime:2400,
        instructions : "Some long set of instructions to put into text hubbledy",
        ingredients : [
                        {amount:1,
                         unit:'tsp',
                         item:'sugar',
                         ingkey:'sugar, granulated'},
            {amount:3,
             unit:'pounds',
             item:'circuitry',
             ingkey:'fakeing'}
        ],
    });
    store.recStore.create({
        title : 'Chocolate Chip Cookies',
        servings : 12,
        yield: {
            amount : 36,
            unit : 'cookies',
        },
        categories : [
            'dessert',
            'American',
            'classic'
        ],
        instructions : 'You know the rest...',
        ingredients : [
            {amount : 0.75,
             unit : 'c',
             item : 'sugar',
             ingkey : 'sugar, granulated'
            },
            {amount : 0.75,
             unit : 'c',
             item : 'brown sugar',
             ingkey : 'sugar, brown'
            },
            {amount : 0.5,
             unit : 'c',
             item : 'butter',
             ingkey : 'butter'
            },
            {amount : 3,
             item : 'eggs',
             ingkey : 'eggs'
            },
            {amount : 2.25,
             unit : 'c',
             item : 'flour',
             ingkey : 'flour, all purpose'
            },
            {amount : 12,
             unit : 'oz',
             item : 'chocolate chips',
             ingkey : 'chocolate chips'
            },
        ]
    });
}                         

var store = {
    curRec : new CurrentRecipe(),
    shopList : new ShoppingList(),
    recStore : new RecipeStore(),
    metadata : Metadata,
    //connect : connectToDB,
    connect : function () {
        this.connectLocal();
        this.setupViews();
        this.setupIndexes();
    },
    isRemoteConnected : function () {
        if (pouchCouch) {
            return true;
        }
        else {
            return false;
        }
    },
    initialize : setupAnew,
    connectLocal : connectToPouch,
    connectRemote : connectToCouch,
    setupViews,
    setupIndexes,
    createTestRecs,
    replicateFromRemote,
    replicateToRemote
}

export default store;