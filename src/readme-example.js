const { Parser, Tags } = require("./line-block-parser");

//we want to recognize lines in javascript block comments
//
//Parser.create(start tag, end tag[, options])
const jsCommentParser = Parser.create(
  Tags.JS_BLOCK_COMMENT_START,
  Tags.JS_BLOCK_COMMENT_END
);

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
const { data, errors } = jsCommentParser.parse(lines);
console.log(
  "lines in blocks: ",
  data.filter(Parser.belongsToBlock).map((a) => a.data)
);
console.log("errors: ", errors);

console.log(
  `----------------------------------------------------------------------------`
);

//using its reducer
const groupedParser = Parser.create(
  Tags.JS_BLOCK_COMMENT_START,
  Tags.JS_BLOCK_COMMENT_END
); //params: start tag, end tag

const linesBelongsToBlock = (data) =>
  data.filter(Parser.belongsToBlock).map((a) => a.data);

//

const { data: dataFromReducer } = groupedParser.flush(
  lines.reduce(groupedParser.getReducer(), Parser.initialLineContext())
);
console.log(
  "(reducer): lines that belongs to a block: ",
  linesBelongsToBlock(dataFromReducer)
);
//console.log("errors: ", errors);

const { data: dataFromParse, errors: errorsFromParse } = groupedParser.parse(
  lines
);
console.log(
  "(parse): lines that belongs to a block: ",
  linesBelongsToBlock(dataFromParse)
);
