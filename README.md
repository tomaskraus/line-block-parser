# Line Block Parser

Recognizes block of lines, such as comment blocks etc.

## Usage

Simple example:

```javascript
const LBP = require("line-block-parser");

const printBlockContent = (line) => {
  return { ...lineContext, output: [...output, line] };
};

const inCommentParser = LBP.Parser.create("/*", "*/");



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


inCommentParser.parseLines(lines);
// => [["  Its fleece was white as snow,", "And every where that Mary went",], ["   That was against the rule,"]]
```

More functional approach:

```javascript
const LBP = require("line-block-parser");

const preserveBlockContentReducer = (line, lineContext) => {
  return { ...lineContext, output: [...output, line] };
};

const inCommentParser2 = LBP.createParser("/*", "*/", "icp2")
  .onBeginMark(null)
  .onEndMark(null)
  .onBlock(preserveBlockContentReducer)
  .onNotBlock(null);

const resultLineContext = lines.reduce(
  inCommentParser2.reducer,
  LBP.initialLineContext
);

inCommentParser2;
```
