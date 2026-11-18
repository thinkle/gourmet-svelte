// One recipe being edited: the draft, whether it differs from what is
// stored, and save / revert / delete through Gourmet's kept data layer.
//
// Why not the kept `recipeStores`: it holds one shared map keyed by both
// local id and server id, merges saves into the old copy instead of replacing
// it, and reads only from IndexedDB. See docs/modernization/specs/recipe-editor.md.
// This module stays thin over `recipeData` instead.
//
//   original  a private copy of the stored record, never edited
//   draft     a deep-reactive copy; the editor writes here, and only when the
//             user changes something
//   dirty     structural: draft and original differ in content
import recipeData from "../data/recipeData.js";
import { clone, same, changedFields, materialize, tidy } from "./recipeEdit.js";

const message = (err) => String(err?.message ?? err?.error ?? err ?? "Unknown error");

export class RecipeEdit {
  /** @type {object} what is stored; replaced (never mutated) on save */
  original = $state.raw({});
  draft = $state({});
  /** "idle" | "saving" | "saved" | "error" */
  status = $state("idle");
  error = $state(null);
  /** Goes up when the draft is replaced wholesale (revert, save), so inputs
      that keep their own text (the rich-text bodies) can start again. */
  version = $state(0);

  dirty = $derived(!same(this.draft, this.original));
  changed = $derived(changedFields(this.draft, this.original));
  /** Never written to the local cache yet. */
  isNew = $derived(this.original.id === undefined || this.original.id === null);
  /** Saved here but the server has not got it yet (it will at the next sync). */
  localOnly = $derived(!this.isNew && !this.original.savedRemote);

  #data;

  /**
     @param stored the stored record (the raw row, not a screen's prepared copy)
     @param data   the data layer; Gourmet's `recipeData` unless a test or
                   fixtures mode hands in another with the same calls
  */
  constructor(stored, { data = recipeData } = {}) {
    this.#data = data;
    // $state.snapshot copies plain objects and reactive ones alike.
    this.original = $state.snapshot(stored ?? {});
    this.draft = $state.snapshot(stored ?? {});
  }

  /** Set one top-level field. */
  set(field, value) {
    this.draft[field] = value;
  }

  /**
     A list field in its regular shape, ready to change in place. Converts an
     odd stored shape (ingredients as strings, text as one string) the first
     time it is asked for, which is the first time the user edits that field.
  */
  list(field) {
    const v = this.draft[field];
    const regular = materialize(field, v);
    if (regular !== v) this.draft[field] = regular;
    return this.draft[field];
  }

  /** The draft as a plain object. */
  snapshot() {
    return $state.snapshot(this.draft);
  }

  revert() {
    this.draft = clone(this.original);
    this.version += 1;
    this.status = "idle";
    this.error = null;
  }

  /**
     Save the draft. Resolves to the stored record, or to null when it failed;
     on failure the draft is kept, still dirty, `status` is "error" and
     `error` says why, and calling save() again retries.
  */
  async save() {
    if (this.status === "saving") return null;
    const sent = this.snapshot();
    const toSave = tidy(sent, this.original);
    this.status = "saving";
    this.error = null;
    try {
      let saved;
      if (this.isNew) {
        // The kept data layer mutates what it is given: hand it a copy.
        // savedRemote 0 marks it for the next sync if the server is not
        // reached: addRecipe leaves the flag unset in that case, and sync()
        // only uploads rows marked 0. On success addRecipe sets it true.
        saved = await this.#data.addRecipe({ ...clone(toSave), savedRemote: 0 });
      } else {
        saved = await this.#data.updateRecipe(clone(toSave));
      }
      if (!saved || typeof saved !== "object") throw new Error("The recipe was not saved.");
      const typedSince = !same(this.snapshot(), sent);
      this.original = clone(saved);
      if (!typedSince) this.draft = clone(saved);
      this.status = "saved";
      return this.original;
    } catch (err) {
      this.status = "error";
      this.error = message(err);
      return null;
    }
  }

  /**
     Soft delete: the stored record marked `deleted`, written through the
     kept data layer (what recipeData.deleteRecipe does, but awaited).
     Unsaved edits are dropped. Resolves true when done.
  */
  async remove() {
    if (this.isNew) return true; // nothing stored to delete
    this.status = "saving";
    this.error = null;
    try {
      const saved = await this.#data.updateRecipe({ ...clone(this.original), deleted: true });
      this.original = clone(saved);
      this.draft = clone(saved);
      this.status = "saved";
      return true;
    } catch (err) {
      this.status = "error";
      this.error = message(err);
      return false;
    }
  }
}
