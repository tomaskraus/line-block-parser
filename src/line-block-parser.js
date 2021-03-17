/**
 *
 * line-blocks parsing library
 *
 */

const fu = require("./func-utils");

const initialLineContext = {
  lineNumber: 0,
  line: "",
};

const DEFAULT_PARSER_ID = "line-block-parser";
const NO_BLOCK_BEGIN = -1;

const initialParserState = {
  beginBlockLineNum: NO_BLOCK_BEGIN,
};

const defaultCallback = (line, lineContext) => null;

class Parser {
  _beginMarkCB = defaultCallback;
  _endMarkCB = defaultCallback;
  _blockCB = defaultCallback;
  _notBlockCB = defaultCallback;

  constructor(beginkMark, endMark, parserId = DEFAULT_PARSER_ID) {
    this.beginkMark = beginkMark;
    this.endMark = endMark;
    this.parserId = parserId;
  }

  static create(beginkMark, endMark, parserId) {
    return new Parser(beginkMark, endMark, parserId);
  }

  onBeginMark(callback) {
    this._beginMarkCB = callback;
    return this;
  }

  onEndMark(callback) {
    this._endMarkCB = callback;
    return this;
  }

  onBlock(callback) {
    this._blockCB = callback;
    return this;
  }

  onNotBlock(callback) {
    this._notBlockCB = callback;
    return this;
  }

  setInitialLineContext(lineContext) {
    return fu.setProp(this.parserId, initialParserState, lineContext);
  }

  getStateFromLineContext(lineContext) {
    return fu.prop(this.parserId, lineContext);
  }

  parseLines(lines) {
    return lines.map((line) => [line]);
  }
}

module.exports = {
  initialLineContext,
  Parser,
};
