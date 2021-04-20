const { PairParser, Tags } = require("../src/line-block-parser");

const dataHandler = (data, lexerUtils) => {
  const d = {
    block: data.inBlock,
    startTagInnerText: lexerUtils.startTagInnerText(data.startTagLine),
    lines: data.data,
    endTagInnerText: lexerUtils.endTagInnerText(data.endTagLine),
  };
  console.log(d);
};

const par = PairParser.create(
  Tags.JS_BLOCK_COMMENT_START,
  Tags.JS_BLOCK_COMMENT_END,
  {
    grouped: true,
    onData: dataHandler,
    onError: (err) => {
      return `ERROR on line: ${err.lineNumber}: ${err.code}, ${err.message}`;
    },
  }
);

const lines = [
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  "/* Its fleece was white as snow,  ",
  " And every where that Mary went */     ",
  "   The lamb was sure to go ;",
  "He followed her to school one day-",
  " /*  That was against the rule,*/ ",
  "It made the children laugh and play,",
  " /*",
  "   To see a lamb at school.",
];

console.log(`
=-=  OTHER TESTS  =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
`);

console.log("lines: ", lines);

const { data, errors } = par.parse(lines);
console.log("parsed data: ", data);
console.log("parsed errors: ", errors);
