/*
 Simple regExp-wrapper utility for making leading and trailing space tolerant, descriptive ones
 */

// from: https://stackoverflow.com/questions/4371565/create-regexps-on-the-fly-using-string-variables
const escapeRegExp = (s) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

const makeSpaceSafeRegExpFromString = (s) =>
  new RegExp("^\\s*" + escapeRegExp(s) + "\\s*$");

/**
 * JS RegExp wrapper, leading and trailing space tolerant
 */
class Tag {
  constructor(str) {
    this.regx = makeSpaceSafeRegExpFromString(str);
  }

  /**
   *
   * @returns internal regExp object
   */
  regexp = () => this.regx;

  tagData = (str) => {
    if (str === null) return null;
    const matches = this.regx.exec(str);
    if (matches === null) return null;
    return matches.length === 0 ? "" : matches[1];
  };
}

module.exports = {
  Tag,
};
