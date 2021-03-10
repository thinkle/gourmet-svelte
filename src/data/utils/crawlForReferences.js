export function crawlForReferences(inglist) {
  let refs = [];
  for (let i of inglist) {
    if (i.reference) {
      refs.push(i);
    }
    if (i.ingredients) {
      refs = [...refs, ...crawlForReferences(i.ingredients)];
    }
  }
  return refs;
}
