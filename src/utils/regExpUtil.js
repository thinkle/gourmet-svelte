export function reToString (re) {
    let s = re.toString();
    return s.substr(1,s.length-(2+re.flags.length));
}
export function reEscape (s) {
    // Not exactly a complete implementation :)
    return s
        .replace(/[(]/g,'[(]')
        .replace(/[)]/g,'[)]')
        .replace(/[*]/g,'[*]')
        .replace(/[.]/g,'[.]');
}

export function countGroupsInRegexp (s) {
    return ' '.match(new RegExp(s+'||\\s')).length
}
