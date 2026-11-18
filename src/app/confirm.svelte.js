// One confirmation question at a time, answered in a Dialog (ConfirmHost in
// the app shell). `await ask({...})` resolves true for yes.
export const pending = $state({ question: null });

let answer = null;

/** @param {{title: string, body?: string, yes?: string, no?: string, danger?: boolean}} question */
export function ask(question) {
  answer?.(false);
  pending.question = question;
  return new Promise((resolve) => (answer = resolve));
}

export function reply(yes) {
  const done = answer;
  answer = null;
  pending.question = null;
  done?.(yes);
}
