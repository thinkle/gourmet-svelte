import setupHandler from './setupDB.js';
let user = {email:'tmhinkle@gmail.com'}
let event = {}
let context = {}

export async function setupEmptyDB () {
    await setupHandler(event,context,user,{action:'setupIndexes'})
}

export async function setupDBwithRecs () {
    await setupHandler(event,context,user,{action:'setupIndexes'})
    await setupHandler(event,context,user,{action:'create_recipes'})
}
export {user,event,context}
