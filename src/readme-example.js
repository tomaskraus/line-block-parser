const { Parser, Tags } = require("./line-block-parser");

//we want to recognize lines in javascript block comments
const jsCommentParser = Parser.create(
  Tags.js_block.start,
  Tags.js_block.end,
  false
); //params: start tag, end tag

//these are lines to parse
const lines = [
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  "/*",
  "  Its fleece was white as snow,",
  "And every where that Mary went",
  " */",
  "   The lamb was sure to go ;",
  "He followed her to school one day-",
  " /* ",
  "   That was against the rule,",
  "*/ ",
  "It made the children laugh and play,",
  "/*",
  "   To see a lamb at school.",
];

//let's go
const blocksFound = jsCommentParser
  .parse(lines)
  .data //data
  .filter((a) => a.state === "inBlock" && a.lineType === "line")
  .map((a) => a.data);

console.log(blocksFound);

console.log(
  `----------------------------------------------------------------------------`
);

//using reducer
const jsP = Parser.create(Tags.js_block.start, Tags.js_block.end, false); //params: start tag, end tag

const { data, errors } = jsP.flush(
  lines.reduce(jsP.getReducer(), Parser.initialLineContext())
);
console.log("data: ", data);
console.log("errors: ", errors);
