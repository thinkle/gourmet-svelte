import { afterEach, describe, it, expect } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import RecipeHero from '../screens/recipe/RecipeHero.svelte';
import { prepare } from '../app/lib.js';

let component;
afterEach(async () => { if (component) await unmount(component); document.body.innerHTML = ''; });

const show = (sources) => {
  const recipe = prepare({ title: 'Pie', ingredients: [], text: [], categories: [], sources });
  component = mount(RecipeHero, { target: document.body, props: { recipe } });
  flushSync();
  return document.querySelector('.sources');
};

describe('the sources line', () => {
  it('puts a space after the comma between sources', () => {
    const p = show([{ name: '28 Cooks' }, { name: "Tom's deep past" }]);
    expect(p.textContent.replace(/\s+/g, ' ')).toContain("28 Cooks, Tom's deep past");
  });
  it('makes a source with a URL a link that opens outside the app', () => {
    const p = show([{ url: 'https://cooking.nytimes.com/recipes/1-pie' }, { name: 'NYT Cooking' }]);
    const a = p.querySelector('a');
    expect(a.textContent).toBe('NYT Cooking');
    expect(a.getAttribute('href')).toBe('https://cooking.nytimes.com/recipes/1-pie');
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toContain('noopener');
  });
  it('shows a source with no URL as plain text', () => {
    expect(show([{ name: "Grandma's notebook" }]).querySelector('a')).toBeNull();
  });
});
