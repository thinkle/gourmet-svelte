function getNodePath (node, addressList) {
    // Given a node with parents, we crawl the whole document...
    // and return our position...
    if (!addressList) {addressList = []}
    var parent = node.parentElement
    if (!parent) {
        return addressList
    }
    var idx = Array.prototype.indexOf.call(parent.childNodes,node)
    if (idx===undefined) {
        addressList.push(99999);
    }
    addressList.push(idx);
    // Go up a step...
    return getNodePath(parent,addressList);
}

export function getNodeAddress (node) {
    var path = getNodePath(node);
    path.reverse();
    path = path.map(
        (i)=>{
            while ((''+i).length < 5) {
                i = '0' + i;
            }
            return i
        });
    return path.join('-');
}
