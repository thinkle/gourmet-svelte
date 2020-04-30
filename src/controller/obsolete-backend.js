// This file looks like a prototype of the interface we want to expose to the front-end. Is this garbage now?






var db = {
    
    getIngredients (id) {
	console.log('Got ingredients: %s',id);
	if (id===1) {
	    console.log('RETURNING THING');
	    return [
		{amount:8,unit:'oz.',item:'flour',id:1},
		{amount:8,unit:'oz.',item:'milk',id:2},
		{amount:2,unit:'large',item:'eggs',id:3},
		{amount:1,unit:'oz.',item:'butter',id:4},
		]
	}
    },

    getShortRec (id) {
	return {
	    id : id,
	    title : 'Pancake Variant #'+id,
	    yields : 1+(id % 4),
	    cuisine : 'American',
	    categories : ['Breakfast'],
	    source : {
		url : 'http://www.google.com',
		name : 'The Internet',
		details : 'No details this time.',
	    },
	    preptime : 30,
	    cooktime : 45,
	    totaltime : 45,
	    thumb : 'http://png/png.png', //(or CDATA),
	    ingredients: this.getIngredients(1),
	}
    },

    getRecipe (id) {
	var r = {
	    id : id,
	    title : 'Pancake Variant #'+id,
	    yields : 2+(id % 4),
	    yield_unit : 'servings',
	    cuisine : 'American',
	    categories : ['Breakfast'],
	    source : {
		url : 'http://www.google.com',
		name : 'The Internet',
		details : 'No details this time.',
	    },
	    preptime : 30,
	    cooktime : 45,
	    totaltime : 45,
	    headnote:"This is not a real recipe.",
	    footnote:"This is a footnote.",
	    image : 'http://png/png.png', //(or CDATA),
	    steps : [
		{label:'1',content:'Wow <b>what fun</b>',id:1},
		{label:'Dry Ingredients',content:'Mix the dry ingredients with a whisk',id:2},
		{label:'Wet Ingredeints',content:'Mix the wet ingredients with a whisk',id:3},
		{label:'All the ingredients',content:'Pour wet into dry and mix with spoon or rubber spatula',id:4},
		{label:'Cooking the pancakes',content:'Cook those babies!',id:5},
	    ],
	    ingredients: this.getIngredients(1),
	}
	console.log(JSON.stringify(r));
	return r;
    },

    query () {
	var nresults = 100;
	var results = [];
	for (var i=0; i<nresults; i++) {results.push(i)}
	return results.map((i)=>this.getShortRec(i));
    },
}
export default db;
