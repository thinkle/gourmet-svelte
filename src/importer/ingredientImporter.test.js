//import sampleParse from './parseData.js';
import {parseChunks,handleChunk} from './importer.js';
import RecDef from '../common/RecDef.js';

fit('Parsing ingredients',
    ()=>{

        function parseIng (text) {
            let chunk = {
                tag:'ingredient',
                text
            }
            let rec = {ingredients:[]}
            handleChunk(chunk,{},rec);
            console.log('Got recs:',rec.ingredients)
            return rec.ingredients[0]
        }

        let result = parseIng('1 ½ cups/360 milliliters whole milk');
        expect(result.text).toMatch(
                /.*whole milk.*/
        );
        expect(result.amount.amount).toEqual(1.5);
        expect(result.amount.unit).toEqual('cups')
        
        result = parseIng('2 ½   cucumbers, peeled, halved lengthwise, seeded, and diced fine (1/2 cup)');
        expect(result.text).toMatch(
                /cucumbers, peeled, halved lengthwise, seeded.*/
        );
        expect(result.amount.amount).toEqual(2.5);
        expect(result.amount.unit).toEqual('cup')
        result = parseIng('6 ounces medium-large shrimp, (31 to 40 per pound), peeled, deveined, halved lengthwise, and halved crosswise');
        expect(result.text).toMatch(
                /medium-large shrimp/
        );
        expect(result.amount.unit).toMatch('ounces');
        expect(result.amount.amount).toEqual(6);
        debugger;
        result = parseIng('1 28 oz can San Marzano tomatoes');
        expect(result.amount.unit).toMatch('oz');
        expect(result.amount.amount).toEqual(28);
    }
  );

it('Ingredient container',
   ()=>{
       let result = parseChunks(
           [
               {tag:'ingredient',address:'1-1',
text:'2     lb   spaghetti'},
               {tag:'ingredient',address:'1-2',text:'3     eggs'},
               {tag:'amount',address:'1-1-1',id:'a',text:'2'},
               {tag:'unit',address:'1-1-2',id:'b',text:'lb'},
               {tag:'ingredientText',address:'1-1-3',id:'c',text:'spaghetti'},
               {tag:'amount',address:'1-2-1',id:'d',text:'3'}
           ],{}
       );
       expect(result.ingredients[0].amount.amount).toEqual(2)
       expect(result.ingredients[0].amount.unit).toEqual('lb')
       expect(result.ingredients[0].text).toEqual('spaghetti')
       expect(result.ingredients[0]).toEqual(
           expect.objectContaining(
               {
                   amount : expect.objectContaining({
                       amount : 2,
                       unit : 'lb',
                   }),
                   text : 'spaghetti'
               }
           )
       )
       expect(result.ingredients[1]).toEqual(
           expect.objectContaining(
               {
                   amount : expect.objectContaining({
                       amount : 3
                   }),
                   text : 'eggs'
               }
                                  )
       );
                                   
                                   
   }
  );

it('Ingredient in pieces',
   ()=>{
       let result = parseChunks(
           [
               {tag:'amount',address:'6',text:'1/2 stick',
               },
               {tag:'ingredientText',address:'8',text:'butter',
               },
                {tag:'amount',address:'1',text:'One',
               },
               {tag:'unit',address:'2',text:'cup',
               },
               {tag:'ingredientText',address:'3',text:'sugar',
               },
               {tag:'amount',address:'4',text:'2-3'
               },
               {tag:'ingredientText',address:'5',text:'eggs'
               },
               {tag:'unit',address:'9',text:'some'},
               {tag:'ingredientText',address:'99',text:'salt'},
               {tag:'ingredient',address:'9920391',text:'3 to 4 cups flour'}
           ],{}
       );
       expect(result.ingredients.length).toEqual(5)
       expect(result.ingredients[2]).toEqual(
           expect.objectContaining({
               amount : {
                   amount : 0.5,
                   unit : 'stick'
               },
               text : 'butter'
           }))
       expect(result.ingredients[3]).toEqual(
           expect.objectContaining({
               amount : {
                   unit : 'some'
               },
               text : 'salt'
           }
                                  )
       );
       expect(result.ingredients[0]).toEqual(
           expect.objectContaining({
               amount:{
                   amount : 1,
                   unit : 'cup'
               },
               text : 'sugar'
           }))
       expect(result.ingredients[1]).toEqual(
           expect.objectContaining({
               amount : {
                   amount : 3,
                   rangeAmount : 2,
               },
               text : 'eggs'
           }))
       expect(result.ingredients[4]).toEqual(
           expect.objectContaining({
               amount : expect.objectContaining({
                   amount : 4,
                   rangeAmount : 3,
                   unit : 'cups'
               }),
               text : 'flour'
           }
                                  )
       );
         
   })

it('Ingredient Groups vanilla',
   ()=>{
       let result = parseChunks(
           [
               {tag:'ingredient',text:'1 cup lettuce',id:'01'},
               {tag:'inggroup',text:'Dressing',id:'02'},
               {tag:'ingredient',text:'1/2 cup oil',id:'03'},
               {tag:'ingredient',text:'2 Tbs vinegar',id:'04'},
               {tag:'inggroup',text:'Crunchy bits',id:'05'},
               {tag:'ingredient',text:'Croutons',id:'06'},
               {tag:'ingredient',text:'Bacon',id:'07'},
           ]
       );
       let ings = result.ingredients;
       let o = expect.objectContaining
       expect(ings.length).toEqual(3)
       // expect(ings[0].text).toEqual('lettuce')
       // expect(ings[1].text).toEqual('Dressing')
       // expect(ings[1].ingredients).toBeDefined();
       // expect(ings[1].ingredients[0].text).toEqual('oil')
       // expect(ings[1].ingredients[1].text).toEqual('vinegar')
       // expect(ings[2].text).toEqual('Crunchy bits')
       expect(ings).toEqual(
           expect.arrayContaining([
               o({text:'lettuce'}),
               o({text:'Dressing',
                  ingredients:expect.arrayContaining([
                      o({
                          text:'oil'
                      }),
                      o({
                          text:'vinegar'
                      }),
                  ])
                 }),
               o({text:'Crunchy bits',
                  ingredients:expect.arrayContaining([
                      o({text:'Croutons'}),
                      o({text:'Bacon'}),
                  ])
                 })
           ])
       );       

   }
  );
it('Ingredient groups with children',
   ()=>{
       debugger;
             let result = parseChunks(
           [
               {tag:'ingredient',text:'1 cup lettuce',id:'01',
                address:'01'
               },
               {tag:'inggroup',text:'Dressing',id:'02',
                address:'02',
                //children:['03','04']},
               },
               {tag:'ingredient',text:'1/2 cup oil',id:'03',
                address:'02-01'
               },
               {tag:'ingredient',text:'2 Tbs vinegar',id:'04',
                address:'02-02',
               },
               {tag:'inggroup',text:'Crunchy bits',id:'05',
                address:'03',
                //children:['06','07']
               },
               {tag:'ingredient',text:'Croutons',id:'06',
                address:'03-01'
               },
               {tag:'ingredient',text:'Bacon',id:'07',
                address:'03-02'
               },
               {tag:'ingredient',text:'Trailing',id:'08',
                address:'04'
               },
           ]
       );
       let ings = result.ingredients;
       let o = expect.objectContaining
       console.log('ings',JSON.stringify(ings))
       expect(ings.length).toEqual(4)
       expect(ings[0].text).toEqual('lettuce')
       expect(ings[3].text).toEqual('Trailing')
       // expect(ings[1].text).toEqual('Dressing')
       // expect(ings[1].ingredients).toBeDefined();
       // expect(ings[1].ingredients[0].text).toEqual('oil')
       // expect(ings[1].ingredients[1].text).toEqual('vinegar')
       // expect(ings[2].text).toEqual('Crunchy bits')
       expect(ings).toEqual(
           expect.arrayContaining([
               o({text:'lettuce'}),
               o({text:'Dressing',
                  ingredients:expect.arrayContaining([
                      o({
                          text:'oil'
                      }),
                      o({
                          text:'vinegar'
                      }),
                  ])
                 }),
               o({text:'Crunchy bits',
                  ingredients:expect.arrayContaining([
                      o({text:'Croutons'}),
                      o({text:'Bacon'}),
                  ])
                 })
           ])
       );
   }
  );
