const { Tag } = require("../src/tag-regexp-creator.js");

test("empty Tag recognizes empty line", () => {
  const tg = new Tag("");
  expect(tg.regexp().test("")).toBe(true);
});

test("empty Tag recognizes white-chars line", () => {
  const tg = new Tag("");
  expect(tg.regexp().test(" ")).toBe(true);
  expect(tg.regexp().test("  ")).toBe(true);
  expect(tg.regexp().test("\t")).toBe(true);
  expect(tg.regexp().test("  \t")).toBe(true);
  expect(tg.regexp().test("  \t ")).toBe(true);
});
