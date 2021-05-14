import { parse, end, toSeconds, pattern } from "iso8601-duration";
import Times from "../utils/times";
import { parseAmount } from "../utils/numbers";
import { cleanupWhitespace, titleCase } from "../utils/textUtils";
import { ignoreMatchingDescendants } from "./importer";

export function handleTime(chunk, context, recipe) {
  ignoreMatchingDescendants(chunk, context);
  let amount;
  if (!amount) {
    amount = parseAmount(chunk.text);
    amount.unit = Times.getTimeUnit(chunk.text);
    amount.seconds = amount.amount * amount.unit;
    if (amount.pretext) {
      amount.name = titleCase(cleanupWhitespace(amount.pretext));
    } else {
      amount.name = "Time";
    }
  }
  amount.text = cleanupWhitespace(chunk.text);
  if (chunk.iso8601) {
    amount.seconds = toSeconds(parse(chunk.iso8601));
    amount.iso8601 = chunk.iso8601;
  } else if (chunk.html) {
    let duration;
    // Try parsing time...
    let doc = new DOMParser().parseFromString(chunk.html, "text/html");
    let candidate = doc.querySelector("*[datetime]");
    if (candidate) {
      amount.seconds = toSeconds(parse(candidate["dateTime"]));
      amount.iso8601 = candidate["dateTime"];
    }
    if (!amount.seconds) {
      candidate = doc.querySelector("*[content]");
      if (candidate) {
        amount.seconds = toSeconds(parse(candidate["content"]));
        amount.iso8601 = candidate["content"];
      }
    }
  }
  if (chunk.detail) {
    amount.name = chunk.detail;
  }
  if ((amount.seconds && !amount.text) || amount.text.match(/^\s+$/)) {
    amount.text = Times.getDescription(amount.seconds);
  }
  if (!recipe.times) {
    recipe.times = [];
  }
  if (amount.seconds) {
    recipe.times.push(amount);
  }
}
