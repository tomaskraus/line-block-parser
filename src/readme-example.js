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
  .data.filter(Parser.belongsToBlock)
  .map((a) => a.data);

console.log(blocksFound);

console.log(
  `----------------------------------------------------------------------------`
);

//using its reducer
const groupedParser = Parser.create(
  Tags.js_block.start,
  Tags.js_block.end,
  true
); //params: start tag, end tag

const linesBelongsToBlock = (data) =>
  data.filter(Parser.belongsToBlock).map((a) => a.data);

//

const { data, errors } = groupedParser.flush(
  lines.reduce(groupedParser.getReducer(), Parser.initialLineContext())
);
console.log(
  "(reducer): lines that belongs to a block: ",
  linesBelongsToBlock(data)
);
//console.log("errors: ", errors);

const { data: dataFromParse, errors: errorsFromParse } = groupedParser.parse(
  lines
);
console.log(
  "(parse): lines that belongs to a block: ",
  linesBelongsToBlock(dataFromParse)
);
