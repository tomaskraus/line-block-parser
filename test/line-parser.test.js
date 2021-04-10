const fu = require("../src/func-utils");
const { LineParser, Tags } = require("../src/line-block-parser");

//

const parserFlat = LineParser.create(Tags.JS_LINE_COMMENT, {
  grouped: false,
});

const parserGrouped = LineParser.create(Tags.JS_LINE_COMMENT, {
  grouped: true,
});
//
const parserFlatCBTagData = LineParser.create(Tags.JS_LINE_COMMENT, {
  grouped: false,
  onData: (data, lexer) => `data: "${lexer.tagData(data.data)}"`,
});

const parserGroupedCB = LineParser.create(Tags.JS_LINE_COMMENT, {
  grouped: true,
  onData: (data) => ({
    groupedData: data.data,
    block: LineParser.inBlock(data),
  }),
});
//
const parserFlatNoReturnCB = LineParser.create(Tags.JS_LINE_COMMENT, {
  grouped: false,
  onData: (data) => {
    console.log("data: ", data.data);
  },
});

const parserGroupedNoReturnCB = LineParser.create(Tags.JS_LINE_COMMENT, {
  grouped: true,
  onData: (data) => {
    console.log("grouped data: ", data.data);
  },
});

//-------------------------------------------

const testLines = (lines, label = "") => {
  fu.log(
    `== lines (${label}) ===============================================================================`
  );
  fu.log("", lines);
  //
  fu.log(`--(${label}) -- parser flat (FLAT mode, no callback) ---------`);
  const parsedFlat = parserFlat.parse(lines);
  fu.log("test result data: ", parsedFlat.data);
  //
  fu.log(`--(${label}) -- parser grouped (GROUPED mode, no callback) ------`);
  const parsedGrouped = parserGrouped.parse(lines);
  fu.log("test result data: ", parsedGrouped.data);
  //
  fu.log(
    `--(${label}) -- parser flat (FLAT mode, callback (tag data) ) ---------`
  );
  const parsedFlatCB = parserFlatCBTagData.parse(lines);
  fu.log("test result data: ", parsedFlatCB.data);
  //
  fu.log(`--(${label}) -- parser grouped (GROUPED mode, callback) ------`);
  const parsedGroupedCB = parserGroupedCB.parse(lines);
  fu.log("test result data: ", parsedGroupedCB.data);

  //
  fu.log(
    `--(${label}) -- parser flat (FLAT mode, noReturn callback) ---------`
  );
  const parsedFlatNoReturnCB = parserFlatNoReturnCB.parse(lines);
  fu.log("test result data: ", parsedFlatNoReturnCB.data);
  //
  fu.log(
    `--(${label}) -- parser grouped (GROUPED mode, noReturn callback) ------`
  );
  const parsedGroupedNoReturnCB = parserGroupedNoReturnCB.parse(lines);
  fu.log("test result data: ", parsedGroupedNoReturnCB.data);
};
//------------------------------------------------------------------------------------------------

fu.log(
  `
  = =  LINE PARSER  = = ------ ------- ----------- ---------- ---------- ------------- -------------
  `
);

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
  "//https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  " //  Mary had a little lamb, ",
  "//  The lamb was sure to go ;",
  "  //He followed her to school one day- ",
];
testLines(wholeComment, "whole comment");

//

const multipleComments = [
  " //https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  " /*",
  "--  Its fleece was white as snow,",
  "//--And every where that Mary went",
  " //*/  ",
  "//   The lamb was sure to go ;",
  "He followed her to school one day-",
  " /* ",
  " //  --   That was against the rule,",
  "*/",
  "It made the children laugh and play,",
  "//   To see a lamb at school.",
];
testLines(multipleComments, "multiple comments");

const emptyComment = [
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  "//",
  "   The lamb was sure to go ;",
];
testLines(emptyComment, "empty comment");

const multipleEmptyComments = [
  "  // ",
  "//",
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  "  //",
  "He followed her to school one day-",
];
testLines(multipleEmptyComments, "multiple empty comments");

//
