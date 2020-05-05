import { writable } from 'svelte/store';

export const recipes = writable({})

function createRecData() {
    const { subscribe, set, update } = writable({});

	return {
            saveRecipe (recipe) {

            },

            saveDraft (recipe) {
            },

            getRecipes ({search=undefined,
                         page=undefined,
                         count=20,
                        }={}) {
                
            },

            getRecipe (id) {
            },

            trashRecipe (recipe) {
            },

            deleteRecipe (recipe) {
            },

            syncToRemote () {
            },
            
            syncFromRemote () {
            },

            checkForChanges (recipe) {
            }

	};
}

export const rd = createRecData();
