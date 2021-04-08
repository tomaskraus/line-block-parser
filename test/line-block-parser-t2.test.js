const fu = require("../src/func-utils");
const { Parser, Tags } = require("../src/line-block-parser");

const parser2 = Parser.create(
  Tags.JS_BLOCK_COMMENT_START,
  Tags.JS_BLOCK_COMMENT_END
);

const testLines = (lines, label = "") => {
  fu.log(
    `-- lines (${label}) ------------------------------------------------------------------------`
  );
  fu.log("", lines);

  fu.log("-- parser2 (BLOCK_PLAIN_FLAT mode) ---------");
  parser2.setMode(Parser.mode.BLOCK_PLAIN_FLAT);
  fu.log("", parser2.parse(lines));

  fu.log("-- parser2 (NOTBLOCK_PLAIN_FLAT mode) ---------");
  parser2.setMode(Parser.mode.NOTBLOCK_PLAIN_FLAT);
  fu.log("", parser2.parse(lines));

  fu.log("-- parser2 (ALL_INFO_FLAT mode) ---------");
  parser2.setMode(Parser.mode.ALL_INFO_FLAT);
  fu.log("", parser2.parse(lines));

  fu.log("-- parser2 (BLOCK_PLAIN_GROUP mode) ---------");
  parser2.setMode(Parser.mode.BLOCK_PLAIN_GROUP);
  fu.log("", parser2.parse(lines));

  fu.log("-- parser2 (BLOCK_INFO_GROUP mode) ---------");
  parser2.setMode(Parser.mode.BLOCK_INFO_GROUP);
  fu.log("", parser2.parse(lines));
};

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

const linesWithoutBlock = [
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  "  Its fleece was white as snow,",
  "And every where that Mary went",
  "   The lamb was sure to go ;",
  "He followed her to school one day-",
  "It made the children laugh and play,",
  "   To see a lamb at school.",
];
testLines(linesWithoutBlock, "linesWithoutBlock");

const linesWithEmptyBlock = [
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  "  Its fleece was white as snow,",
  "/*",
  "*/",
  "And every where that Mary went",
  "   The lamb was sure to go ;",
  "/*",
  "--He followed her to school one day-",
  "*/",
  "It made the children laugh and play,",
  "   To see a lamb at school.",
];
testLines(linesWithEmptyBlock, "linesWithEmptyBlock");

const linesWithBlockNotOpen = [
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  "  Its fleece was white as snow,",
  "And every where that Mary went",
  "   The lamb was sure to go ;",
  "*/",
  "He followed her to school one day-",
  "It made the children laugh and play,",
  "   To see a lamb at school.",
];
testLines(linesWithBlockNotOpen, "linesWithBlockNotOpen");

const linesWithBlockNotClosed = [
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  "  Its fleece was white as snow,",
  "And every where that Mary went",
  "   The lamb was sure to go ;",
  "/*",
  "--He followed her to school one day-",
  "--It made the children laugh and play,",
  "--   To see a lamb at school.",
];
testLines(linesWithBlockNotClosed, "linesWithBlockNotClosed");

const linesWithBlockNotClosed2 = [
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  "/*",
  "--  Its fleece was white as snow,",
  "*/",
  "And every where that Mary went",
  "   The lamb was sure to go ;",
  "/*",
  "--He followed her to school one day-",
  "--It made the children laugh and play,",
  "--   To see a lamb at school.",
];
testLines(linesWithBlockNotClosed2, "linesWithBlockNotClosed2");

const linesWithBlockNotClosed3 = [
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  "--  Its fleece was white as snow,",
  "And every where that Mary went",
  "",
  "   The lamb was sure to go ;",
  "/*",
];
testLines(linesWithBlockNotClosed3, "linesWithBlockNotClosed3");

const linesWithBlockNotClosed_withTagDescription = [
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  "/*",
  "--  Its fleece was white as snow,",
  "the first end tag*/",
  "And every where that Mary went",
  "   The lamb was sure to go ;",
  " /* this is the last tag  ",
  "--He followed her to school one day-",
  "--It made the children laugh and play,",
  "--   To see a lamb at school.",
];
testLines(
  linesWithBlockNotClosed_withTagDescription,
  "linesWithBlockNotClosed_withTagDescription"
);

const linesWithBlockNotClosed_more_WellFormattedTags = [
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  "/*",
  "--  Its fleece was white as snow,",
  "the first end tag*/  ",
  " /*also well formatted start of a block",
  "And every where that Mary went",
  " also well formatted end of a block  */  ",
  "   The lamb was sure to go ;",
  " /* this is the last start tag  ",
  "--He followed her to school one day-",
  "--It made the children laugh and play,",
  "--   To see a lamb at school.",
];
testLines(
  linesWithBlockNotClosed_more_WellFormattedTags,
  "linesWithBlockNotClosed_more_WellFormattedTags"
);

fu.log(
  "======INFO BLOCK MODE detail===(linesWithBlockNotClosed2)========================================================================="
);
parser2.setMode(Parser.mode.BLOCK_INFO_GROUP);
const res = parser2.parse(linesWithBlockNotClosed2);
fu.log("", res);
fu.log("data[0]-------------");
fu.log("", res[0].data);
