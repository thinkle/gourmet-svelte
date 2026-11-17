import RecipeDemo from './Recipe.demo.svelte'
import {tick} from 'svelte';
import { render, fireEvent } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { testRecs } from '../../common/mocks/recipes.js'
import deepcopy from 'deepcopy';
let defaultRec = 'standard'
let standard = testRecs[defaultRec]


function reduceWS (text) {
    return text
        .replace(/\s+/g,' ') // reduce whitespace to single space
        .replace(/^\s+|\s+$/g,''); // remove leading/trailing
}

// How do we do decorators in JS?
function _getByContainingText (getByText) {
    return function (text) {
        text = reduceWS(text);
        return getByText((content, node) => {
            const hasText = node => reduceWS(node.textContent) === text
            const nodeHasText = hasText(node);
            const childrenDontHaveText = Array.from(node.children).every(
                child => !hasText(child)
            );
            return nodeHasText && childrenDontHaveText;
        })
    }
}


describe(
    'Recipe tests',
    ()=>{

        it('Recipe renders', ()=>{
            let r = render(RecipeDemo);
            let titleElement = r.getByText(standard.title)
            let categoryElement = r.getByText(standard.categories[0].name)
        })
        

        it('ingredients multiply', async () => {
            const {getByText,getByLabelText} = render(RecipeDemo);
            const getByContainingText = _getByContainingText(getByText)
            // We have 3 cups diced and peeled potato
            // hard-coded search here
            let potatoes = getByContainingText('3 cups diced and peeled potato')
            let multiplier = getByLabelText('multiply by')
            await userEvent.type(multiplier,'{backspace}2');
            //await tick();
            //expect(multiplier.textContent).toMatch(/2/)
            expect(potatoes.textContent).toMatch(/6/)
        });

        it('edit mode works', async () => {
            const {getByText,getByLabelText,container} = render(RecipeDemo);
            const getByContainingText = _getByContainingText(getByText)
            let editButton = getByText('Edit Recipe');
            await userEvent.click(editButton);
            console.log('Now it looks like:',container);

        })
        
    }
);
