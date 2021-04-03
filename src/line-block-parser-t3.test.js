const fu = require("./func-utils");
const { Parser, Tags } = require("./line-block-parser");

const nothingReturnCallback = (data) => fu.log("- - - - - - data: ", data);

const valueReturnCallback = (data) => {
  fu.log(". . . . data: ", data);
  return data.data;
};

const parserFlat = Parser.create(Tags.js_block.start, Tags.js_block.end);

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
  fu.log("test result: ", parserFlat.parseLines(lines));

  fu.log("-- parser grouped (GROUPED mode, no callback) ---------");
  fu.log("test result: ", parserGrouped.parseLines(lines));

  fu.log(
    "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - "
  );
  //
  fu.log("-- parser flat (FLAT mode, callback no return) ---------");
  fu.log("test result: ", parserFlatCBnoReturn.parseLines(lines));

  fu.log("-- parser grouped (GROUPED mode, callback no return) ---------");
  fu.log("test result: ", parserGroupedCB_noReturn.parseLines(lines));

  fu.log(
    "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - "
  );
  //
  fu.log("-- parser flat (FLAT mode, callback return) ---------");
  fu.log("test result: ", parserFlatCB_Return.parseLines(lines));

  fu.log("-- parser grouped (GROUPED mode, callback return) ---------");
  fu.log("test result: ", parserGroupedCB_Return.parseLines(lines));
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
