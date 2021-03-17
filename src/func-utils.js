/**
 * utilities
 */

const log = console.log;

//nullOrEmpty :: a -> bool
const nullOrUndefined = (a) => {
  return a === null || typeof a === "undefined";

  //if (a == null || typeof === "undefined") return true;
  //if (typeof a)
};

// curry2 :: ((a -> b) -> c) -> (a -> b -> c)
const curry2 = (f) => (...args) => {
  if (args.length >= 2) {
    return f(args[0], args[1]);
  } else if (args.length == 1) {
    return (b) => f(args[0], b);
  }
  return (a) => (b) => f(a, b);
};

// curry2 :: ((a -> b -> c) -> d) -> (a -> b -> c -> d)
const curry3 = (f) => (...args) => {
  if (args.length >= 3) {
    return f(args[0], args[1], args[2]);
  } else if (args.length == 2) {
    return (a) => f(args[0], args[1], a);
  } else if (args.length == 1) {
    return curry2((a, b) => f(args[0], a, b));
  }
  return (a) => (b) => (c) => f(a, b, c);
};

// prop :: name -> obj -> value
const prop = curry2((propName, obj) => obj[propName]);

// setProp :: name -> value -> obj -> { ...obj, name: value}
const setProp = curry3((propName, value, obj) => {
  const obj2 = { ...obj };
  obj2[propName] = value;
  return obj2;
});

module.exports = {
  log,
  nullOrUndefined,
  curry2,
  curry3,
  prop,
  setProp,
};
