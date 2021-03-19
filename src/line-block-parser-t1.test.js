const fu = require("./func-utils");
const { Parser } = require("./line-block-parser");

const lines = [
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  "/*",
  "  Its fleece was white as snow,",
  "And every where that Mary went",
  "*/",
  "   The lamb was sure to go ;",
  "He followed her to school one day-",
  "/*",
  "   That was against the rule,",
  "*/",
  "It made the children laugh and play,",
  "   To see a lamb at school.",
];

fu.log("-- lines -----");
fu.log(lines);

fu.log("-------");

const parser = Parser.create("/*", "*/");
fu.log("parser", parser);

fu.log("-- parser ---------");
fu.log("", parser.parseLines(lines));

fu.log("-------");

const parser2 = Parser.create("/*", "*/");
fu.log("parser2", parser2);
fu.log("orig:", parser);

fu.log("-- parser2 (default mode) ---------");
fu.log("", parser2.parseLines(lines));

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

// => [["  Its fleece was white as snow,", "And every where that Mary went",], ["   That was against the rule,"]]
