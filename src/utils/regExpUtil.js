export function reToString (re) {
    let s = re.toString();
    return s.substr(1,s.length-(2+re.flags.length));
}
