import { getSurroundingSentence } from "./textUtils";

it("Get surrounding sentence works", () => {
  expect(
    getSurroundingSentence("Hello world. This is very cool. Nice one.", 3)
  ).toEqual("Hello world.");
  expect(
    getSurroundingSentence("Hello world. This is very cool. Nice one.", 3, 1)
  ).toEqual("llo world.");
  expect(
    getSurroundingSentence("Hello world. This is very cool. Nice one.", 13, 10)
  ).toEqual("This is very cool.");
  expect(getSurroundingSentence("...", 1, 0)).toEqual("");
  expect(getSurroundingSentence("..hello?...", 2, 0)).toEqual("hello?");
});
