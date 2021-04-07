const fu = require("../src/func-utils");
const { Parser, Tags } = require("../src/line-block-parser");

const nothingReturnCallback = (data) => fu.log("- - - - - - data: ", data);

const valueReturnCallback = (data) => {
  fu.log(". . . . data: ", data);
  fu.log("belongsToBlock", Parser.belongsToBlock(data));
  fu.log("isInsideBlock", Parser.isInsideBlock(data));
  return data.data;
};

const parserFlat = Parser.create(Tags.js_block.start, Tags.js_block.end, false);

const parserGrouped = Parser.create(
  Tags.js_block.start,
  Tags.js_block.end,
  true
);
//
const parserFlatCBnoReturn = Parser.create(
  Tags.js_block.start,
  Tags.js_block.end,
  false,
  nothingReturnCallback
);

const parserGroupedCB_noReturn = Parser.create(
  Tags.js_block.start,
  Tags.js_block.end,
  true,
  nothingReturnCallback
);
//
const parserFlatCB_Return = Parser.create(
  Tags.js_block.start,
  Tags.js_block.end,
  false,
  valueReturnCallback
);

const parserGroupedCB_Return = Parser.create(
  Tags.js_block.start,
  Tags.js_block.end,
  true,
  valueReturnCallback
);

//-------------------------------------------

const testLines = (lines, label = "") => {
  fu.log(
    `-- lines (${label}) ------------------------------------------------------------------------`
  );
  fu.log("", lines);
  //
  fu.log("-- parser flat (FLAT mode, no callback) ---------");
  fu.log("test result data: ", parserFlat.parseLines(lines).data);

  fu.log("-- parser grouped (GROUPED mode, no callback) ---------");
  fu.log("test result data: ", parserGrouped.parseLines(lines).data);

  fu.log(
    "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - "
  );
  //
  fu.log("-- parser flat (FLAT mode, callback no return) ---------");
  fu.log("test result data: ", parserFlatCBnoReturn.parseLines(lines).data);

  fu.log("-- parser grouped (GROUPED mode, callback no return) ---------");
  fu.log("test result data: ", parserGroupedCB_noReturn.parseLines(lines).data);

  fu.log(
    "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - "
  );
  //
  fu.log("-- parser flat (FLAT mode, callback return) ---------");
  fu.log("test result: data ", parserFlatCB_Return.parseLines(lines).data);

  fu.log("-- parser grouped (GROUPED mode, callback return) ---------");
  fu.log("test result data: ", parserGroupedCB_Return.parseLines(lines).data);
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
