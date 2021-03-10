import {prepRecsRemote} from './validate.js';

it (
    'ID Generation Works for references',
    ()=>{
        const user = {
            name : 'Joe Shmoe',
            email : 'joe@shmoe.io'
        }
        let data = {recipes:[
            {localid:10,
             title:'foo'
            },
            {localid:11,title:'bar',
             ingredients:[{reference:10,text:'foo',amount:{amount:2,unit:'recipes'}},{amount:{amount:1},text:'pumpkin'}]
            }
        ]}
        prepRecsRemote(data,user);
        let recs = data.recipes;
        expect(recs.length).toEqual(2);
        expect(recs[0]._id).toEqual(recs[1].ingredients[0].reference);
        console.log('Generated',JSON.stringify(recs));

        
    }
);
