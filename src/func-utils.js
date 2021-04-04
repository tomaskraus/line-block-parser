/**
 * utilities
 */

//nullOrUndefined :: a -> bool
const nullOrUndefined = (a) => {
  return a === null || typeof a === "undefined";
};

//id :: a -> a
const id = (a) => a;

//compose2 :: (b -> c) -> (a -> b) -> (a -> c)
const compose2 = (f, g) => (a) => f(g(a));

//compose3 :: (c -> d) -> (b -> c) -> (a -> b) -> (a -> d)
const compose3 = (f, g, h) => (a) => f(g(h(a)));

// curry2 :: ((a -> b) -> c) -> (a -> b -> c)
const curry2 = (f) => (...args) => {
  if (args.length >= 2) {
    return f(args[0], args[1]);
  } else if (args.length == 1) {
    return (b) => f(args[0], b);
  }
  return (a) => (b) => f(a, b);
};

const log = console.log;

//tap :: (a -> b) -> a -> a
const tap = curry2((f, a) => {
  f(a);
  return a;
});

//tapLog :: string -> a -> a
const tapLog = curry2((label, a) => tap((x) => log(label, x), a));

// curry3 :: ((a -> b -> c) -> d) -> (a -> b -> c -> d)
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

// overProp :: name -> (a -> b) -> {..., name: a} -> { ..., name: b}
const overProp = curry3((propName, fn, obj) => {
  const obj2 = { ...obj };
  obj2[propName] = fn(obj2[propName]);
  return obj2;
});

module.exports = {
  nullOrUndefined,
  id,
  tap,
  log,
  tapLog,
  compose2,
  compose3,
  curry2,
  curry3,
  prop,
  setProp,
  overProp,
};
