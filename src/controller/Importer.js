import Metadata from './RecDef.js';
import store from './Gourmet.js';
import {float_to_frac,frac_to_float} from '../utils/Numbers.js'
import Units from '../utils/Units.js';
import {numberMatcher} from '../utils/Numbers.js';
window.UNIT_REGEXP = Units.Amounts.UNIT_REGEXP

function parseHtmlIng (html) {
    
}

function parseTextIng (text) {
    text = text.trim();
    var ing = {}
    var m = text.match(numberMatcher);
    if (m) {
        if (m.index == 0) {
            ing.amount = m[1]
            text = text.substr(0,m.index) + text.substr(m.index+m.length-1);
        }
    }

    var m = Units.Amounts.UNIT_REGEXP.exec(text);
    if (m) {
        //console.log('Trimming unit from text',text);
        ing.unit = m[1]
        text = text.substr(0,m.index)+text.substr(m.index+m[1].length) // rest of text...
        //console.log('Unit- %s Text %s',ing.unit,text);
    }
    ing.item = text;
    //console.log('Parsed ing: %s',JSON.stringify(ing));
    return ing;
}

function RecipeImporter (callback) {

    var self = {
        callback : callback,
        recipe : {
            ingredients : [],
        }, // the body of the recipe we start...
    
        currentIng : {}, // the body of the current ingredient

        currentText : '', // the body of the current text blob we are in

        commitIng () {
            if (self.currentIng.amount) {
                try {
                    self.currentIng.amount = frac_to_float(self.currentIng.amount);
                }
                catch (err) {
                    console.log('Unable to make sense of amount: %s',self.currentIng.amount);
                }
            }
            console.log('Committing ing: %s',JSON.stringify(self.currentIng));
            self.recipe.ingredients.push(self.currentIng);
            self.currentIng = {};
        },

        parseIngredient (block) {
            if (self.currentIng.item) {
                // If we already have an item, assume we are starting
                // fresh...
                self.commitIng();
            }
            else {
                if (block.html) {
                    var ingprops = parseHtmlIng(block.html);
                }
                else {
                    var ingprops = parseTextIng(block.value||block.text)
                }
                self.currentIng = {
                    ...ingprops,
                    ...self.currentIng
                }
                self.commitIng();
            }
            
        },

        parseIngredients (block) {
            console.log('Not yet implemented: parseIngredients');
        },

        parseRecipe (block) {
            console.log('Not yet implemented: parseRecipe');
        },

        handleCustomImportBlock (block, prop) {
            if (prop.name=='recipe') {
                self.parseRecipe(block);
            }
            if (prop.name=='ingredient') {
                self.parseIngredient(block);
            }
            if (prop.name=='ingredients') {
                self.parseIngredients(block);
            }
        },

        handleIngProp (block, prop) {
            // If this property is one we already have in our ingredient...
            if (self.currentIng[prop.name]) {
                // then we better start a *new* ingredient...
                self.commitIng();
            }
            self.currentIng[prop.name] = block.value||block.text;
        },

        handleRecProp (block, prop) {
            if (!self.recipe[prop.name]) {
                self.recipe[prop.name] = block.value||block.text;
            }
            else if (prop.edit==Metadata.EditModes.MCMB) {
                if (!self.recipe[prop.name].push) {
                    self.recipe[prop.name] = [self.recipe[prop.name]]
                }
                self.recipe[prop.name].push(block.value||block.text);
            }
        },

        handleBlock (block) {
            var prop = Metadata.byProp[block.part];
            if (prop.propType == 'importProps') {
                // Custom import handler...
                self.handleCustomImportBlock(block,prop);
            }
            else if (prop.propType == 'ingProps') {
                // custom import handler for ingredient parts...
                self.handleIngProp(block,prop);
            }
            else if (prop.propType == 'recProps') {
                // handle rec props...
                self.handleRecProp(block,prop);
            }
            else if (prop.propType == 'recBlocks') {
                self.handleRecProp(block,prop);
            }
            else {
                console.log('Unknown block: prop=%s',JSON.stringify(prop));
                console.log('Block = %s',block);
                console.log('IGNORING');
                // throw error?
                throw 'bad import prop '+prop;
            }
        },
    
        handleBlocks (blocks) {
            blocks.forEach(self.handleBlock);
        },

        import () {
            console.log('Import!');
            store.connect()
                .then(()=>{
                    console.log('We connected!');
                    store.recStore.create(self.recipe)
                        .then(self.callback);
                })
                .catch(
                    (e)=>{
                        console.log('importer failed to conenct to store: %s',e)
                    }
                );
        },
    }
    return self;
}
    



var Importer = {
    parseRecipe (items, callback) {
        console.log('Welcome world!');
        var importer = RecipeImporter(callback);
        console.log('Now let us handle the blocks!');
        importer.handleBlocks(items);
        importer.import();
    },
}

export default Importer;
