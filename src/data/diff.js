import RecDef from '../common/RecDef.js'

export function diffRecs (r1, r2) {
    if (r1 && !r2) {return r1}
    if (!r1 && r2) {return r2}
    if (!r1 && !r2) {return undefined}
    let diffs = []
    for (let p of [...RecDef.titleProps,...RecDef.recProps,{name:'images',array:true},{name:'ingredients',array:true}]) {
        if (!propIsEqual(r1[p.name],r2[p.name],p)) {
            diffs.push(p,r1[p.name],r2[p.name])
        }
    }
    if (diffs.length == 0) {
        return false
    } else {
        return diffs
    }
}

function propIsEqual (v1, v2, p) {
    if (JSON.stringify(v1) === JSON.stringify(v2)) {
        return true;
    } else {
        if (p.array) {
            if ((!v1 || v1.length==0) && (!v2 || v2.length==0)) {
                return true;
            }
        }
    }
    return false; // default
}
