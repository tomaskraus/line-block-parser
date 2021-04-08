const fu = require("../src/func-utils");
const { Parser, Tags } = require("../src/line-block-parser");

const nothingReturnCallback = (data) => fu.log("- - - - - - data: ", data);

const valueReturnCallback = (data) => {
  fu.log(". . . . data: ", data);
  fu.log("belongsToBlock", Parser.belongsToBlock(data));
  return data.data;
};

const parserFlat = Parser.create(
  Tags.JS_BLOCK_COMMENT_START,
  Tags.JS_BLOCK_COMMENT_END,
  {
    grouped: false,
  }
);

const parserGrouped = Parser.create(
  Tags.JS_BLOCK_COMMENT_START,
  Tags.JS_BLOCK_COMMENT_END,
  {
    grouped: true,
  }
);
//
const parserFlatCBnoReturn = Parser.create(
  Tags.JS_BLOCK_COMMENT_START,
  Tags.JS_BLOCK_COMMENT_END,
  { grouped: false, onData: nothingReturnCallback }
);

const parserGroupedCB_noReturn = Parser.create(
  Tags.JS_BLOCK_COMMENT_START,
  Tags.JS_BLOCK_COMMENT_END,
  { grouped: true, onData: nothingReturnCallback }
);
//
const parserFlatCB_Return = Parser.create(
  Tags.JS_BLOCK_COMMENT_START,
  Tags.JS_BLOCK_COMMENT_END,
  { grouped: false, onData: valueReturnCallback }
);

const parserGroupedCB_Return = Parser.create(
  Tags.JS_BLOCK_COMMENT_START,
  Tags.JS_BLOCK_COMMENT_END,
  { grouped: true, onData: valueReturnCallback }
);

//-------------------------------------------

const testLines = (lines, label = "") => {
  fu.log(
    `-- lines (${label}) ------------------------------------------------------------------------`
  );
  fu.log("", lines);
  //
  fu.log("-- parser flat (FLAT mode, no callback) ---------");
  fu.log("test result data: ", parserFlat.parse(lines).data);

  fu.log("-- parser grouped (GROUPED mode, no callback) ---------");
  fu.log("test result data: ", parserGrouped.parse(lines).data);

  fu.log(
    "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - "
  );
  //
  fu.log("-- parser flat (FLAT mode, callback no return) ---------");
  fu.log("test result data: ", parserFlatCBnoReturn.parse(lines).data);

  fu.log("-- parser grouped (GROUPED mode, callback no return) ---------");
  fu.log("test result data: ", parserGroupedCB_noReturn.parse(lines).data);

  fu.log(
    "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - "
  );
  //
  fu.log("-- parser flat (FLAT mode, callback return) ---------");
  fu.log("test result: data ", parserFlatCB_Return.parse(lines).data);

  fu.log("-- parser grouped (GROUPED mode, callback return) ---------");
  fu.log("test result data: ", parserGroupedCB_Return.parse(lines).data);
};

//------------------------------------------------------------------------------------------------

const emptyLines = [];
testLines(emptyLines, "emptyLines");

const lines = [
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  " /*",
  "--  Its fleece was white as snow,",
  "--And every where that Mary went",
  "*/  ",
  "   The lamb was sure to go ;",
  "He followed her to school one day-",
  " /* ",
  "--   That was against the rule,",
  "*/",
  "It made the children laugh and play,",
  "   To see a lamb at school.",
];
testLines(lines);
