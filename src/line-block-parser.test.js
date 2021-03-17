const fu = require("./func-utils");
const LBP = require("./line-block-parser");

const parser = LBP.Parser.create("/*", "/*");
fu.log("parser", parser);

const parser2 = LBP.Parser.create("//", "", "lineParser")
  .onBeginMark("ahoj")
  .onEndMark("cau");
fu.log("parser2", parser2);
fu.log("orig:", parser);

const lines = [
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  "/*",
  "  Its fleece was white as snow,",
  "And every where that Mary went",
  "/*",
  "   The lamb was sure to go ;",
  "He followed her to school one day-",
  "/*",
  "   That was against the rule,",
  "/*",
  "It made the children laugh and play,",
  "   To see a lamb at school.",
];

fu.log(lines);
fu.log("-----------");
fu.log("", parser2.parseLines(lines));
// => [["  Its fleece was white as snow,", "And every where that Mary went",], ["   That was against the rule,"]]
