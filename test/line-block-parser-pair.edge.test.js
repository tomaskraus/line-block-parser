const fu = require("../src/func-utils");
const { Parser, Tags } = require("../src/line-block-parser");

const parserFlat = Parser.create(Tags.js_block.start, Tags.js_block.end, false);

const parserGrouped = Parser.create(
  Tags.js_block.start,
  Tags.js_block.end,
  true
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
  //
  fu.log("-- parser grouped (GROUPED mode, no callback) ---------");
  const parsedData = parserGrouped.parseLines(lines).data;
  fu.log("test result data: ", parsedData);
  // fu.log("data[0]:", parserGrouped.parseLines(lines).data[0]);
  // fu.log("data[1]:", parserGrouped.parseLines(lines).data[1]);
};
//------------------------------------------------------------------------------------------------

const emptyLines = [];
testLines(emptyLines, "emptyLines");

//

const noCommentLines = [
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  "   The lamb was sure to go ;",
  "He followed her to school one day-",
];
testLines(noCommentLines, "no comment");

//

const wholeComment = [
  "  /* ",
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  "   The lamb was sure to go ;",
  "He followed her to school one day-",
  "   */    ",
];
testLines(wholeComment, "whole comment");

//

const consecutiveComments = [
  "  /* ",
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  "   */    ",
  "  /* ",
  "   The lamb was sure to go ;",
  "   */    ",
  "He followed her to school one day-",
];
testLines(consecutiveComments, "consecutiveComments");

//

const emptyComment = [
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  "  /* ",
  "   */    ",
  "   The lamb was sure to go ;",
];
testLines(emptyComment, "empty comment");

//

const emptyComment2 = [
  "  /* ",
  "   */    ",
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  "  /* ",
  "   */    ",
  "   The lamb was sure to go ;",
  "He followed her to school one day-",
  "  /* ",
];
testLines(emptyComment2, "empty comment 2");

//

const openComment = [
  "  /* ",
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  "   */    ",
  "  /* ",
  "   The lamb was sure to go ;",
  "He followed her to school one day-",
];
testLines(openComment, "open comment");
