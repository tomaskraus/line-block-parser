/*
 Simple regExp-wrapper utility for making leading and trailing space tolerant, descriptive ones
 */

// from: https://stackoverflow.com/questions/4371565/create-regexps-on-the-fly-using-string-variables
const escapeRegExp = (s) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

const tagData = (regex, str) => {
  if (str === null) return null;
  const matches = regex.exec(str);
  return matches === null ? null : matches[1];
};

/**
 * JS RegExp wrapper, leading and trailing space tolerant
 */
const StartTag = {
  create: (str) => {
    const regx =
      str === ""
        ? new RegExp("^\\s*$")
        : new RegExp("^\\s*" + escapeRegExp(str) + "(.*)$");
    return {
      regexp: () => regx,
      tagData: (str) => tagData(regx, str),
    };
  },
};

const EndTag = {
  create: (str) => {
    const regx =
      str === ""
        ? new RegExp("^\\s*$")
        : new RegExp("^(.*)" + escapeRegExp(str) + "\\s*$");
    return {
      regexp: () => regx,
      tagData: (str) => tagData(regx, str),
    };
  },
};

module.exports = {
  StartTag,
  EndTag,
};
