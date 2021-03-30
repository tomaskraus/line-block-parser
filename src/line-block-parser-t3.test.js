const fu = require("./func-utils");
const { Parser, Tags } = require("./line-block-parser");

const parser2 = Parser.create(Tags.js_block.start, Tags.js_block.end);

const testLines = (lines, label = "") => {
  fu.log(
    `-- lines (${label}) ------------------------------------------------------------------------`
  );
  fu.log("", lines);

  fu.log("-- parser2 (ALL_INFO_FLAT mode) ---------");
  parser2.setMode(Parser.mode.ALL_INFO_FLAT);
  fu.log("", parser2.parseLines(lines));
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
