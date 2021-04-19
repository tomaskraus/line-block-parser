const fu = require("../src/func-utils");
const { SectionParser, Tags } = require("../src/line-block-parser");

const nothingReturnCallback = (data) => fu.log("- - - - - - data: ", data);

const valueReturnCallback = (data) => {
  fu.log(". . . . data: ", data);
  fu.log("in block", SectionParser.inBlock(data));
  return data.data;
};

const parserFlat = SectionParser.create(
  "[", "]",
  {
    grouped: false,
  }
);

const parserGrouped = SectionParser.create(
  "[", "]",
  { grouped: true, onData: nothingReturnCallback }
);
//
//-------------------------------------------

const testLines = (lines, label = "") => {
  fu.log(
    `-- lines (${label}) ------------------------------------------------------------------------`
  );
  fu.log("", lines);
  //
  fu.log("-- section parser flat (FLAT mode, no callback) ---------");
  fu.log("test result data: ", parserFlat.parse(lines).data);

  fu.log("-- section parser grouped (GROUPED mode, no callback) ---------");
  fu.log("test result data: ", parserGrouped.parse(lines).data);

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
