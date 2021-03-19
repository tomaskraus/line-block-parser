const { Parser } = require("./line-block-parser");

//we want to recognize lines in javascript block comments
const jsCommentParser = Parser.create("/*", "*/"); //params: start tag, end tag

//these are lines to parse
const lines = [
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  "/*",
  "  Its fleece was white as snow,",
  "And every where that Mary went",
  "*/",
  "   The lamb was sure to go ;",
  "He followed her to school one day-",
  "/*",
  "   That was against the rule,",
  "*/",
  "It made the children laugh and play,",
  "   To see a lamb at school.",
];

//let's go
const blocksFound = jsCommentParser.parseLines(lines);

console.log(blocksFound);
