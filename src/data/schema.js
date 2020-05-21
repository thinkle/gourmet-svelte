/*
* schema.js isn't a real schema, just an example of what we think our
* recipe collection might look like when we're done.
*/

const collection =
      {
          metadata : {
              user : 'Hinkle, Thomas',
              lastUpdate :'2020-04-30',
          },
          nutrients : {
              id : 'banana',
              kcal : 123
              // ...
          },
          recipes : [
              {
                  id : 'unique-identifier',
                  title : '',
                  thumbnail : 'data-url:alskdfjlaskjdflajksdflkajsdlfjkalsdkjflasjdkf',
                  images : ['','',''], // We could also embed images in text as needed
                  properties : {
                      sources : [
                          {name : 'source',
                           url : '',
                           email : '',},
                      ],
                      yield : {
                          amount : 3,
                          unit : 'cups',
                          density : '1.123',
                          mL : 'Volume in milliliters?',
                          g : 'weight in grams',
                      },
                      category : ['Dessert','Dinner','Indian'],
                      preptime : {
                          text  : 'A long while',
                          seconds : 400000,
                      },
                      cooktime : {
                          text  : 'A long while',
                          seconds : 400000,
                      },
                      totaltime : {
                          text : 'One minute', seconds : 60,
                      },
                  },
                  text : {
                      headnote : '',
                      instructions : '', // Sanitized-ish HTML
                      modifications : '',
                      steps : '',
                      footnote: '',
                  },
                  ingredients : [
                      {
                          text : 'Title and preparation',
                          amount : {
                              number : 3,
                              unit : 'teaspoons',
                              g : 123,
                              ml : 123,
                          },
                          density : 1,
                          nutrient : 'id of nutrient key',
                      },
                  ],
                  
              },
          ]
      }
