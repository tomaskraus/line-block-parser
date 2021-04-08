const fu = require("../src/func-utils");
const { Parser, Tags } = require("../src/line-block-parser");

const parserFlat = Parser.create(Tags.js_block.start, Tags.js_block.end, {
  grouped: false,
});

const parserGrouped = Parser.create(Tags.js_block.start, Tags.js_block.end, {
  grouped: true,
});

const parserGroupedNullError = Parser.create(
  Tags.js_block.start,
  Tags.js_block.end,
  {
    grouped: true,
    onError: (err) => {
      console.log(`ERROR on line: ${err.lineNumber}`);
    },
  }
);

const parserGroupedCustomError = Parser.create(
  Tags.js_block.start,
  Tags.js_block.end,
  {
    grouped: true,
    onError: (err) => err.lineNumber,
  }
);

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
  fu.log("test result errors: ", parsedFlat.errors);
  //
  fu.log(
    `--(${label}) -- parser grouped (GROUPED mode, no callback) ---------`
  );
  const parsedGrouped = parserGrouped.parse(lines);
  fu.log("test result data: ", parsedGrouped.data);
  fu.log("test result errors: ", parsedGrouped.errors);

  fu.log(
    `--(${label}) -- parser grouped custom error (GROUPED mode, custom error callback) ---------`
  );
  const parsedGroupedCustomError = parserGroupedCustomError.parse(lines);
  fu.log("test result data: ", parsedGroupedCustomError.data);
  fu.log("test result errors: ", parsedGroupedCustomError.errors);

  fu.log(
    `--(${label}) -- parser grouped null error (GROUPED mode, nothing-returning error callback) ---------`
  );
  const parsedGroupedNullError = parserGroupedNullError.parse(lines);
  fu.log("test result data: ", parsedGroupedNullError.data);
  fu.log("test result errors: ", parsedGroupedNullError.errors);
};
//------------------------------------------------------------------------------------------------

fu.log(
  `
  = =  EDGE CASES  = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
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

const multipleEmptyComment = [
  "  /* ",
  "   */    ",
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  "  /* ",
  "   */    ",
  "   The lamb was sure to go ;",
  "He followed her to school one day-",
];
testLines(multipleEmptyComment, "multiple empty comment");

//

const unclosedComment = [
  "  /* ",
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  "   */    ",
  "  /* ",
  "   The lamb was sure to go ;",
  "He followed her to school one day-",
];
testLines(unclosedComment, "unclosed comment");

const emptyUnclosedComment = [
  "  /* ",
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  "   */    ",
  "",
  "  /* ",
];
testLines(emptyUnclosedComment, "empty unclosed comment");

//

const repeatedStartTag = [
  "  /* ",
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "/*",
  "Mary had a little lamb,",
  "   The lamb was sure to go ;",
  "He followed her to school one day-",
  "   */    ",
];
testLines(repeatedStartTag, "repeated startTag");

const consecutiveStartTag = [
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  "   The lamb was sure to go ;",
  "/*",
  " /*",
  "He followed her to school one day-",
  "   */    ",
];
testLines(consecutiveStartTag, "consecutive startTag");

const multipleRepeatedStartTag = [
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "/*",
  "Mary had a little lamb,",
  "/*",
  "   The lamb was sure to go ;",
  " /*",
  "He followed her to school one day-",
  "   */    ",
];
testLines(multipleRepeatedStartTag, "multiple repeated startTag");

//

const repeatedEndTag = [
  "  /* ",
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  " */   ",
  "Mary had a little lamb,",
  "   */    ",
  "  /* ",
  "   The lamb was sure to go ;",
  "   */    ",
  "He followed her to school one day-",
];
testLines(repeatedEndTag, "repeatedEndTag");

const consecutiveEndTag = [
  "  /* ",
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  " */   ",
  "   */    ",
  "Mary had a little lamb,",
  "  /* ",
  "   The lamb was sure to go ;",
  "   */    ",
  "He followed her to school one day-",
];
testLines(consecutiveEndTag, "consecutive EndTag");

const multipleEndTag = [
  "  /* ",
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  " */   ",
  "   */    ",
  "Mary had a little lamb,",
  "  /* ",
  "   The lamb was sure to go ;",
  "   */    ",
  "He followed her to school one day-",
  "*/",
];
testLines(multipleEndTag, "multiple EndTag");

//

const endTagAtBegin = [
  " */ ",
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  "  /* ",
  "   The lamb was sure to go ;",
  "   */    ",
  "He followed her to school one day-",
];
testLines(endTagAtBegin, "EndTag at the beginning");

//

const multipleErrorTypes = [
  "*/",
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  " /*",
  " /*",
  "--  Its fleece was white as snow,",
  "--And every where that Mary went",
  "*/  ",
  "*/  ",
  "   The lamb was sure to go ;",
  "He followed her to school one day-",
  " /* ",
  "--   That was against the rule,",
  "*/",
  " /* ",
  "It made the children laugh and play,",
  "   To see a lamb at school.",
];
testLines(multipleErrorTypes, "multiple error types");
