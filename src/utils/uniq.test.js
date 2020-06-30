import {unique,uniqueByKey} from './uniq.js';

it(
    'Vanilla Unique',
    ()=>{
        let u = unique([1,2,3,3,4]);
        expect(u.length).toEqual(4);
        expect(u[0]).toEqual(1);
        expect(u[1]).toEqual(2);
        expect(u[2]).toEqual(3);
        expect(u[3]).toEqual(4);
        u = unique([4,3,1,2,3,3,4,2,2,3,3,2,1]);
        expect(u.length).toEqual(4)
        expect(u[0]).toEqual(4)
        expect(u[1]).toEqual(3)
        expect(u[2]).toEqual(1)
        let o = {1:1}
        u = unique([o,{1:1},o,o]);
        expect(u.length).toEqual(2);
        expect(u[0]).toEqual(o);
    }
);

it(
    'Keyed Unique',
    ()=>{
        let arr = [
            // dup k
            {k:1,2:2,j:1}, // k1
            {k:1,3:3,j:2},{k:1,3:3,j:2},{k:1,3:3,j:2},{k:1,3:3,j:2}, // dups
            {k:2,j:3}, // k2
            {k:3,j:4}] // k3
        let u = uniqueByKey(arr,'k');
        expect(u.length).toEqual(3);
        expect(u[0].j).toEqual(1)
        expect(u[1].k).toEqual(2)
        expect(u[2].k).toEqual(3)
        u = uniqueByKey(arr,'j');
        expect(u.length).toEqual(4);
    }
);
