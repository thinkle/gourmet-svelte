import validate,{is,is_in} from './validator.js'

it(
    'Vanilla Type Validation',
    ()=>{
        expect(
            ()=>validate('hello','')
        ).not.toThrow();
        expect(
            ()=>validate('hello',1)
        ).toThrow();
        expect(
            ()=>validate({num:1,str:'hello'},{num:7,str:'world'})
        ).not.toThrow()
        expect(
            ()=>validate({num:1,str:12},{num:7,str:'world'})
        ).toThrow()
        expect(
            ()=>validate({num:1,str:'hello'},{num:7,str:'world',nested:{foo:1}})
        ).toThrow()
        expect(
            ()=>validate({num:1,str:'howdy',nested:{foo:1}},{num:7,str:'world',nested:{foo:17}})
        ).not.toThrow()
    }
)

it(
    'Fancy validation',
    ()=>{
        expect(
            ()=>validate('hello',is_in(['hello','world']))
        ).not.toThrow()
        expect(
            ()=>validate('howdy',is_in(['hello','world']))
        ).toThrow()
        expect(
            ()=>validate('howdy',is('howdy'))
        ).not.toThrow()
        expect(
            ()=>validate('howdy',is('hello'))
        ).toThrow()
        expect(
            ()=>validate({message:'hello'},{message:is_in(['hello','world'])})
        ).not.toThrow()
        expect(
            ()=>validate({message:'what is up???'},{message:is_in(['hello','world'])})
        ).toThrow()


    }
);

it(
    'handle nulls...',
    ()=>{
        expect(
            ()=>validate(null,null)
        ).not.toThrow();
        expect(
            ()=>validate({},null)
        ).toThrow();
    }
);
