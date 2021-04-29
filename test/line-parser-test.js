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
const parserFlatCBTagInnerText = LineParser.create(Tags.JS_LINE_COMMENT, {
  grouped: false,
  onData: (data, lexerUtils) =>
    `innerText: "${lexerUtils.tagInnerText(data.data)}"`,
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
    `--(${label}) -- parser flat (FLAT mode, callback (tag inner text) ) ---------`
  );
  const parsedFlatCB = parserFlatCBTagInnerText.parse(lines);
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

//-----------------------------------------------------------------------------------------------------------

const dataNumCheck = (data) => {
  const num = parseInt(data.data, 10);
  console.log("data: ", data.data);
  if (isNaN(num)) {
    throw new TypeError("not exactly a number");
  }
  return [data.lineNumber, num];
};

//

const lines2 = `
1
2
3
abc
5

6
`;

fu.log(
  `--() -- exception parser flat (FLAT mode, dataException callback) ---------`
);

const parserFlatDataExceptionCB = LineParser.create(Tags.JS_LINE_COMMENT, {
  grouped: false,
  onData: dataNumCheck,
});
const parsedFlatNoReturnExceptionCB = parserFlatDataExceptionCB.parse(
  lines2.split("\n")
);
fu.log("test result data: ", parsedFlatNoReturnExceptionCB.data);
fu.log("test errors: ", parsedFlatNoReturnExceptionCB.errors);

//

fu.log(
  `--() -- exception parser flat (FLAT mode, propagated dataException callback) ---------`
);

const parserFlatPropagatedDataExceptionCB = LineParser.create(
  Tags.JS_LINE_COMMENT,
  {
    grouped: false,
    onData: dataNumCheck,
    onError: (err) => {
      throw err;
    },
  }
);

try {
  const parsedFlatPropagatedDataExceptionCB = parserFlatPropagatedDataExceptionCB.parse(
    lines2.split("\n")
  );

  fu.log("test result data: ", parsedFlatPropagatedDataExceptionCB.data);
  fu.log("test errors: ", parsedFlatPropagatedDataExceptionCB.errors);
} catch (e) {
  fu.log("catch: ", e.message);
}
