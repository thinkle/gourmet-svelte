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


it('Recipe renders and ingredients multiply', async () => {
    const {getByText,
           getByLabelText,
           getAllByText,
           container,
           component} = render(RecipeDemo);
    const getByContainingText = _getByContainingText(getByText);
    let titleElement = getByText(standard.title)
    let categoryElement = getByText(standard.categories[0].name)
    // We have 3 cups diced and peeled potato
    // hard-coded search here
    let potatoes = getByContainingText('3 cups diced and peeled potato')
    let multiplier = getByLabelText('multiply by')
    await userEvent.type(multiplier,'{backspace}2');
    //await tick();
    //expect(multiplier.textContent).toMatch(/2/)
    expect(potatoes.textContent).toMatch(/6/)
})
