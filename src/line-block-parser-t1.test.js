const fu = require("./func-utils");
const { Parser, Tags } = require("./line-block-parser");

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

const parser = Parser.create(Tags.js_block.start, Tags.js_block.end);
fu.log("parser", parser);

fu.log("-- parser ---------");
fu.log("", parser.parseLines(lines));

fu.log("-------");

const parser2 = Parser.create(Tags.js_block.start, Tags.js_block.end);
fu.log("parser2", parser2);
fu.log("orig:", parser);

fu.log("-- parser2 (default mode) ---------");
fu.log("", parser2.parseLines(lines));

fu.log("-- parser2 (BLOCK_PLAIN_FLAT mode) ---------");
parser2.setMode(Parser.mode.BLOCK_PLAIN_FLAT);
fu.log("", parser2.parseLines(lines));

fu.log("-- parser2 (NOTBLOCK_PLAIN_FLAT mode) ---------");
parser2.setMode(Parser.mode.NOTBLOCK_PLAIN_FLAT);
fu.log("", parser2.parseLines(lines));

fu.log("-- parser2 (ALL_INFO_FLAT mode) ---------");
parser2.setMode(Parser.mode.ALL_INFO_FLAT);
fu.log("", parser2.parseLines(lines));

fu.log("-- parser2 (BLOCK_PLAIN_GROUP mode) ---------");
parser2.setMode(Parser.mode.BLOCK_PLAIN_GROUP);
fu.log("", parser2.parseLines(lines));

fu.log("-- parser2 (BLOCK_INFO_GROUP mode) ---------");
parser2.setMode(Parser.mode.BLOCK_INFO_GROUP);
fu.log("", parser2.parseLines(lines));

// => [["  Its fleece was white as snow,", "And every where that Mary went",], ["   That was against the rule,"]]
