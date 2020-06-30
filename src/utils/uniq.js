export function uniqueByKey (arr, key) {
    return arr.filter(
        (itm,idx)=>arr.findIndex((o)=>o[key]==itm[key])==idx
    );
}

export function unique (arr) {
    return arr.filter(
        (itm,idx)=>arr.indexOf(itm)==idx
    )
}

