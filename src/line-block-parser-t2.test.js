const fu = require("./func-utils");
const { Parser } = require("./line-block-parser");

const parser2 = Parser.create("/*", "*/");

const testLines = (lines, label = "") => {
  fu.log(
    `-- lines (${label}) ------------------------------------------------------------------------`
  );
  fu.log("", lines);

  fu.log("-- parser2 (PLAIN_FLAT_BLOCK mode) ---------");
  parser2.setMode(Parser.mode.PLAIN_FLAT_BLOCK);
  fu.log("", parser2.parseLines(lines));

  fu.log("-- parser2 (PLAIN_FLAT_NOT_BLOCK mode) ---------");
  parser2.setMode(Parser.mode.PLAIN_FLAT_NOT_BLOCK);
  fu.log("", parser2.parseLines(lines));

  fu.log("-- parser2 (INFO_FLAT_ALL mode) ---------");
  parser2.setMode(Parser.mode.INFO_FLAT_ALL);
  fu.log("", parser2.parseLines(lines));

  fu.log("-- parser2 (PLAIN_GROUP_BLOCK mode) ---------");
  parser2.setMode(Parser.mode.PLAIN_GROUP_BLOCK);
  fu.log("", parser2.parseLines(lines));

  fu.log("-- parser2 (INFO_GROUP_BLOCK mode) ---------");
  parser2.setMode(Parser.mode.INFO_GROUP_BLOCK);
  fu.log("", parser2.parseLines(lines));
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
  "*/  the first end tag",
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

const linesWithBlockNotClosed_illFormattedTagDescription = [
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  "/*",
  "--  Its fleece was white as snow,",
  "*/  the first end tag",
  "/*illFormatedTag (no space before the description)",
  "And every where that Mary went",
  " */illFormatedTag (no space before the description) ",
  "   The lamb was sure to go ;",
  " /* this is the last tag  ",
  "--He followed her to school one day-",
  "--It made the children laugh and play,",
  "--   To see a lamb at school.",
];
testLines(
  linesWithBlockNotClosed_illFormattedTagDescription,
  "linesWithBlockNotClosed_illFormattedTagDescription"
);

fu.log(
  "======INFO BLOCK MODE detail===(linesWithBlockNotClosed2)========================================================================="
);
parser2.setMode(Parser.mode.INFO_GROUP_BLOCK);
const res = parser2.parseLines(linesWithBlockNotClosed2);
fu.log("", res);
fu.log("data[0]-------------");
fu.log("", res[0].data);
