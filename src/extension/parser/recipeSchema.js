// https://schema.org/Recipe
export const recipeSchemaSelector = '*[itemtype="https://schema.org/Recipe"],.cookbook-recipe';

export const importer = [
    {selector:'.cookbook-name',
     tag:'title'},
    {selector:'.cookbook-author',
     tag:'source'},
    {selector:'.entry-author-name',
     tag:'source'},
    {selector:'[itemprop="prepTime"]',
     tag:'time',
     detail:'Prep Time'},
    {selector:'cookbook-image',
     tag:'image'},
    {selector:'[itemprop="cookTime"]',
     tag:'time',
     detail:'Cook Time'},
    {selector:'[itemprop="totalTime"]',
     tag:'time',
     detail:'Total Time'},
    {selector:'[itemprop="recipeIngredient"]',
     tag:'ingredient'},
    {selector:'.cookbook-container-ingredients',tag:'ingredients'},
    {selector:'.cookbook-container-ingredients .cookbook-subtitle',
     tag:'inggroup'},
    {selector:'.cookbook-container-instructions',
     tag:'text',detail:'instructions'},
    {selector:'[itemprop="recipeCategory"]',
     tag:'category'},
    {selector:'[itemprop="recipeCuisine',
     tag:'category',detail:'Cuisine'},
    {selector:'[itemprop="recipeYield"]',
     tag:'yields'},
    {selector:'[itemprop="recipeYield"]',
     tag:'yields'},
    {selector:'[itemprop="recipeInstructions"]',
     tag:'text'},
];
