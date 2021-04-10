# Line Block Parser

Recognizes multi-line blocks - such as block comments etc.
Simple to use, yet quite powerful.

## Usage

### Simple example

```js
const { PairParser, Tags } = require("./line-block-parser");

//we want to recognize lines in javascript block comments
//
//Parser.create(start tag, end tag[, options])
const jsCommentParser = PairParser.create(
  Tags.JS_BLOCK_COMMENT_START,
  Tags.JS_BLOCK_COMMENT_END
);

//these are lines to parse
const lines = [
  "https://en.wikipedia.org/wiki/Mary_Had_a_Little_Lamb",
  "Mary had a little lamb,",
  "/*",
  "  Its fleece was white as snow,",
  "And every where that Mary went",
  " */",
  "   The lamb was sure to go ;",
  "He followed her to school one day-",
  " /* ",
  "   That was against the rule,",
  "*/ ",
  "It made the children laugh and play,",
  "/*",
  "   To see a lamb at school.",
];

//let's go
const { data, errors } = jsCommentParser.parse(lines);
console.log(
  "lines in blocks: ",
  data.filter(PairParser.inBlock).map((a) => a.data)
);
console.log("errors: ", errors);
```

Output:

```shell
lines in blocks:  [
  [
    '  Its fleece was white as snow,',
    'And every where that Mary went'
  ],
  [ '   That was against the rule,' ],
  [ '   To see a lamb at school.' ]
]
errors:  [
  {
    name: 'ParserError',
    message: 'Missing end-tag at the end of the final block',
    lineNumber: 14
  }
]

```

TODO: describe behavior of both start and end tag at one line
