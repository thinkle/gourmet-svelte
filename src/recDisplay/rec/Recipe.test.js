import RecipeDemo from './Recipe.demo.svelte'
import { render, fireEvent } from '@testing-library/svelte'
import { testRecs } from '../../common/mocks/recipes.js'
import deepcopy from 'deepcopy';

it('Recipe renders', () => {
    const {getByText,getById} = render(RecipeDemo);
    
    //render(Recipe)
  // //  const increment = getByText('increment')
  // //  const decrement = getByText('decrement')
  // const counter = getByTestId('counter-value')
  
  // await fireEvent.click(increment)
  // await fireEvent.click(increment)
  // await fireEvent.click(increment)
  // await fireEvent.click(decrement)

  // expect(counter.textContent).toBe('2')

  // with jest-dom
    //expect(counter).toHaveTextContent('2')
})
