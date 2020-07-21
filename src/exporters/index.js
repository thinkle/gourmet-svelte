import schemaExporter from './schemaExporter.js'
import {prepRecLocal} from '../data/validate.js'

const exporters = [
    {
        type : 'gourmet-json',
        label : 'Gourmet Web Backup File',
        extension : 'grmt-web.json',
        convert : (r)=>{
            r = prepRecLocal(r);
            delete r.words;
            delete r.ings;
            return r;
        },
        convertMany (rr) {
            return {
                recipes: rr.map(this.convert),
                metadata : {
                    date : new Date(),
                    user : rr.length && rr[0] && rr[0].owner || '',
                }
            }
        }
    },
    schemaExporter];


function exportRecipe (recipe, type) {
    for (let exp of exporters) {
        if (exp.type===type) {
            return exp.convert(recipe)
        }
    }
}

function exportRecipes (recipes, type) {
    for (let exp of exporters) {
        if (exp.type===type) {
            if (exp.convertMany) {
                return exp.convertMany(recipes)
            } else {
                return recipes.map(
                    exp.convert
                )
            }
        }
    }
    throw `Exporter for type ${type} not found`
}


export {exporters, exportRecipes, exportRecipe}
