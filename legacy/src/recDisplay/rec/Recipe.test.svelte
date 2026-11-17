import Recipe from './Recipe.svelte'
import { render, fireEvent } from '@testing-library/svelte'

it('it works', async () => {
  const { getByText, getByTestId } = render(Counter)

  // //  const increment = getByText('increment')
  // //  const decrement = getByText('decrement')
  // const counter = getByTestId('counter-value')

  // await fireEvent.click(increment)
  // await fireEvent.click(increment)
  // await fireEvent.click(increment)
  // await fireEvent.click(decrement)

  // expect(counter.textContent).toBe('2')

  // with jest-dom
  expect(counter).toHaveTextContent('2')
})