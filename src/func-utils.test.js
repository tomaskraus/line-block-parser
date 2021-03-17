const u = require("./func-utils");

const hr = (caption = null) =>
  u.log("----" + (caption ? " " + caption + " " : "") + "-------------------");

hr("nullOrUndefined");
u.log("null", u.nullOrUndefined(null));
u.log("{}.something_undefined", u.nullOrUndefined({}.something_undefined));
u.log(
  "something_undeclared",
  "//error" /*u.nullOrUndefined(something_undeclared)*/
);
u.log("''", u.nullOrUndefined(""));
u.log("[]", u.nullOrUndefined([]));
u.log("{}", u.nullOrUndefined({}));
u.log("0", u.nullOrUndefined(false));
u.log("2", u.nullOrUndefined(false));
u.log("false", u.nullOrUndefined(false));
u.log('"a"', u.nullOrUndefined("a"));
u.log("[1]", u.nullOrUndefined([1]));

hr("compose2");
const intoArr = (a) => [a];
const inc = (k) => k + 1;
const incToArr = u.compose2(intoArr, inc);
u.log("incToArr(2)", incToArr(2));

hr("compose3");
const intoArr_1 = (a) => [a];
const inc_1 = (k) => k + 1;
const toStr_1 = (a) => `${a}`;
const incToStrArr = u.compose3(intoArr_1, toStr_1, inc_1);
u.log("incToStrArr(2)", incToStrArr(2));

hr("plus");

const plus = (a, b) => a + b;
u.log("plus(1,2)", plus(1, 2));
u.log("plus(1)", plus(1));
u.log("plus(1)(2)", "//error");
u.log("plus()", plus());
u.log("plus()(1)", "//error");
u.log("plus()(1)(2)", "//error");

hr("curry2");

const cplus = u.curry2(plus);
u.log("cplus(1,2)", cplus(1, 2));
u.log("cplus(1)", cplus(1));
u.log("cplus(1)(2)", cplus(1)(2));
u.log("cplus()", cplus());
u.log("cplus()(1, 2)", cplus()(1, 2));
u.log("cplus()(1)", cplus()(1));
u.log("cplus()(1)(2)", cplus()(1)(2));

hr("prop");

u.log('prop("length", "abcd")', u.prop("length", "abcd"));
const len = u.prop("length");
u.log('len("abcd")', len("abcd"));
u.log("len([2,3,4])", len([2, 3, 4]));

hr();

const weatherStationObj = {
  temp: 12,
  humidity: 60,
};

u.log("", weatherStationObj);

hr("curry3 3");
const weatherStationObj2 = u.setProp("temp", 14, weatherStationObj);

u.log("obj2", weatherStationObj2);
u.log("obj", weatherStationObj);

hr("curry3 2");

const setVersionTo1 = u.setProp("version", "1.0");
u.log("setVersionTo1", setVersionTo1(weatherStationObj2));
u.log("obj2", weatherStationObj2);

hr("curry3 1");
const setVersion = u.setProp("version");
u.log(
  'setVersion("1.2")(weatherStationObj)',
  setVersion("1.2")(weatherStationObj)
);
u.log(
  'setVersion("1.3", weatherStationObj)',
  setVersion("1.3", weatherStationObj)
);
u.log("obj", weatherStationObj);

//weird, but functional
u.log([1, 2, 3, 4, 5]["length"]);

hr("overProp  curry3 2");
const toStr = (a) => `${a}`;
const inc1 = (k) => k + 1;
const tempIncToStr = u.overProp("temp", u.compose2(toStr, inc1));
const weatherStationObj3 = tempIncToStr(weatherStationObj);

u.log("weatherStationObj3", weatherStationObj3);
u.log("weatherStationObj", weatherStationObj);
u.log("obj", weatherStationObj);
