const { StartTag, EndTag } = require("../src/line-regexp-builder.js");

describe("empty startTag  ('')", () => {
  test("empty startTag recognizes empty line", () => {
    const tg = StartTag.create("");
    expect(tg.regexp().test("")).toBe(true);
  });

  test("empty startTag recognizes white-chars line", () => {
    const tg = StartTag.create("");
    expect(tg.regexp().test(" ")).toBe(true);
    expect(tg.regexp().test("  ")).toBe(true);
    expect(tg.regexp().test("\t")).toBe(true);
    expect(tg.regexp().test("  \t")).toBe(true);
    expect(tg.regexp().test("  \t ")).toBe(true);
  });

  test("empty startTag omits non-white-chars line", () => {
    const tg = StartTag.create("");
    expect(tg.regexp().test("a")).toBe(false);
    expect(tg.regexp().test(" a")).toBe(false);
    expect(tg.regexp().test(" something ")).toBe(false);
  });
});

//

describe("simple startTag (':')", () => {
  test("simple StartTag omits an empty line", () => {
    const tg = StartTag.create(":");
    expect(tg.regexp().test("")).toBe(false);
  });

  test("simple StartTag omits line that does not contain it", () => {
    const tg = StartTag.create(":");
    expect(tg.regexp().test("something")).toBe(false);
  });

  test("simple startTag omits line that does not contain it as the first non-white character", () => {
    const tg = StartTag.create(":");
    expect(tg.regexp().test("-:")).toBe(false);
    expect(tg.regexp().test(" b:")).toBe(false);
  });

  test("simple startTag recognizes lines with leading and trailing white chars", () => {
    const tg = StartTag.create(":");
    expect(tg.regexp().test(":")).toBe(true);
    expect(tg.regexp().test(" :")).toBe(true);
    expect(tg.regexp().test(": ")).toBe(true);
    expect(tg.regexp().test(" : \t")).toBe(true);
  });
});

//

describe("complex startTag ('/**')", () => {
  test("complex startTag omits an empty line", () => {
    const tg = StartTag.create("/**");
    expect(tg.regexp().test("")).toBe(false);
  });

  test("complex StartTag omits line that does not contain it", () => {
    const tg = StartTag.create("/**");
    expect(tg.regexp().test("something")).toBe(false);
  });

  test("complex startTag omits line that does not contain it as the first non-white character", () => {
    const tg = StartTag.create("/**");
    expect(tg.regexp().test("-/**")).toBe(false);
    expect(tg.regexp().test(" abcd/**")).toBe(false);
  });

  test("complex startTag recognizes lines with leading and trailing white chars", () => {
    const tg = StartTag.create("/**");
    expect(tg.regexp().test("/**")).toBe(true);
    expect(tg.regexp().test("  /**")).toBe(true);
    expect(tg.regexp().test("/** ")).toBe(true);
    expect(tg.regexp().test(" /** \t ")).toBe(true);
  });
});

//

describe("startTag tagData method", () => {
  test("empty startTag tagData returns null", () => {
    const tg = StartTag.create("");
    expect(tg.tagData(" // this is a description  ")).toBe(null);
  });

  test("line with startTag tagData is recognized", () => {
    const tg = StartTag.create("//");
    expect(tg.regexp().test(" // this is a description  ")).toBe(true);
  });

  test("tagData recognizes its tag description", () => {
    const tg = StartTag.create("//");
    expect(tg.tagData(" // this is a description  ")).toEqual(
      " this is a description  "
    );
    expect(tg.regexp().exec(" // this is a description  ")[1]).toEqual(
      " this is a description  "
    );
  });

  test("tagData returns empty string for startTag with trailing end of line", () => {
    const tg = StartTag.create("//");
    expect(tg.tagData(" //")).toEqual("");
    expect(tg.regexp().exec(" //")[1]).toEqual("");
  });

  test("tagData returns null for non-matching line", () => {
    const tg = StartTag.create("//");
    // console.log()
    expect(tg.tagData("")).toEqual(null);
    expect(tg.regexp().exec("")).toEqual(null);

    expect(tg.tagData("abcd")).toEqual(null);
    expect(tg.regexp().exec("abcd")).toEqual(null);
  });

  test("tagData returns null for a null line", () => {
    const tg = StartTag.create("//");
    // console.log()
    expect(tg.tagData(null)).toEqual(null);
    expect(tg.regexp().exec(null)).toEqual(null);
  });
});

//--------------------------------------------------------------------------------------------------------------

describe("empty EndTag  ('')", () => {
  test("empty EndTag recognizes empty line", () => {
    const tg = EndTag.create("");
    expect(tg.regexp().test("")).toBe(true);
  });

  test("empty EndTag recognizes white-chars line", () => {
    const tg = EndTag.create("");
    expect(tg.regexp().test(" ")).toBe(true);
    expect(tg.regexp().test("  ")).toBe(true);
    expect(tg.regexp().test("\t")).toBe(true);
    expect(tg.regexp().test("  \t")).toBe(true);
    expect(tg.regexp().test("  \t ")).toBe(true);
  });

  test("empty EndTag omits non-white-chars line", () => {
    const tg = EndTag.create("");
    expect(tg.regexp().test("a")).toBe(false);
    expect(tg.regexp().test(" a")).toBe(false);
    expect(tg.regexp().test(" something ")).toBe(false);
  });
});

//

describe("simple EndTag (':')", () => {
  test("simple EndTag omits an empty line", () => {
    const tg = EndTag.create(":");
    expect(tg.regexp().test("")).toBe(false);
  });

  test("simple EndTag omits line that does not contain it", () => {
    const tg = EndTag.create(":");
    expect(tg.regexp().test(" some thing ")).toBe(false);
  });

  test("simple EndTag omits line that contains non-white character after it", () => {
    const tg = EndTag.create(":");
    expect(tg.regexp().test(":-")).toBe(false);
    expect(tg.regexp().test(" :b")).toBe(false);
    expect(tg.regexp().test("  :something")).toBe(false);
  });

  test("simple EndTag recognizes lines with leading and trailing white chars", () => {
    const tg = EndTag.create(":");
    expect(tg.regexp().test(":")).toBe(true);
    expect(tg.regexp().test(" :")).toBe(true);
    expect(tg.regexp().test(": ")).toBe(true);
    expect(tg.regexp().test(" : ")).toBe(true);
  });
});

//

describe("complex EndTag ('**/')", () => {
  test("complex EndTag omits an empty line", () => {
    const tg = EndTag.create("**/");
    expect(tg.regexp().test("")).toBe(false);
  });

  test("complex EndTag omits line that does not contain it", () => {
    const tg = EndTag.create("**/");
    expect(tg.regexp().test("something")).toBe(false);
  });

  test("complex EndTag omits line that contains non-white character after it", () => {
    const tg = EndTag.create("**/");
    expect(tg.regexp().test(" **/-")).toBe(false);
    expect(tg.regexp().test("/**/ b")).toBe(false);
    expect(tg.regexp().test("**/something")).toBe(false);
  });

  test("complex EndTag recognizes itself", () => {
    const tg = EndTag.create("**/");
    expect(tg.regexp().test("**/")).toBe(true);
  });

  test("complex EndTag recognizes lines with leading and trailing characters", () => {
    const tg = EndTag.create("**/");
    expect(tg.regexp().test(" **/")).toBe(true);
    expect(tg.regexp().test("**/ ")).toBe(true);
    expect(tg.regexp().test(" **/ ")).toBe(true);
  });
});

//

describe("EndTag tagData method", () => {
  test("empty endTag tagData returns null", () => {
    const tg = EndTag.create("");
    expect(tg.tagData(" // this is a description  ")).toBe(null);
  });

  test("line with endTag tagData is recognized", () => {
    const tg = EndTag.create("*/");
    expect(tg.regexp().test("this is a description*/")).toBe(true);
  });

  test("tagData recognizes its tag description", () => {
    const tg = EndTag.create("*/");
    expect(tg.tagData(" this is a description  */")).toEqual(
      " this is a description  "
    );
    expect(tg.regexp().exec(" this is a description  */")[1]).toEqual(
      " this is a description  "
    );
  });

  test("tagData returns empty string for EndTag at the start of line", () => {
    const tg = EndTag.create("*/");
    expect(tg.tagData("*/")).toEqual("");
    expect(tg.regexp().exec("*/")[1]).toEqual("");
  });

  test("tagData returns null for non/matching line", () => {
    const tg = EndTag.create("*/");
    // console.log()
    expect(tg.tagData("")).toEqual(null);
    expect(tg.regexp().exec("")).toEqual(null);

    expect(tg.tagData("abcd")).toEqual(null);
    expect(tg.regexp().exec("abcd")).toEqual(null);
  });

  test("tagData returns null for a null line", () => {
    const tg = EndTag.create("//");
    // console.log()
    expect(tg.tagData(null)).toEqual(null);
    expect(tg.regexp().exec(null)).toEqual(null);
  });
});

//--------------------------------------------------------------------------------------------------------------
