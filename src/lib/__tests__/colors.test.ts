import { COLOR_LIST, generateKeywordColors } from "../colors";
import { FrontMatterUniversalType } from "../mdx";

describe("generateKeywordColors", () => {
  it("should return an empty array if the input array is empty", () => {
    const input: FrontMatterUniversalType[] = [];
    const result = generateKeywordColors(input);
    expect(result).toEqual([]);
  });

  it("should correctly assign colors to unique keywords", () => {
    const input: FrontMatterUniversalType[] = [
      {
        title: "Test 1",
        filename: "test1.md",
        date: "2024-01-01",
        keywords: "alpha, beta, gamma",
        author: "Author 1",
        index: 1,
      },
      {
        title: "Test 2",
        filename: "test2.md",
        date: "2024-01-02",
        keywords: "delta, epsilon, alpha",
        author: "Author 2",
        index: 2,
      },
    ];

    const expectedOutput = [
      { Keyword: "alpha", Color: COLOR_LIST[0] },
      { Keyword: "beta", Color: COLOR_LIST[1] },
      { Keyword: "gamma", Color: COLOR_LIST[2] },
      { Keyword: "delta", Color: COLOR_LIST[3 % COLOR_LIST.length] },
      { Keyword: "epsilon", Color: COLOR_LIST[4 % COLOR_LIST.length] },
    ];

    const result = generateKeywordColors(input);
    expect(result).toEqual(expectedOutput);
  });

  it("should ignore duplicate keywords and trim spaces", () => {
    const input: FrontMatterUniversalType[] = [
      {
        title: "Test 1",
        filename: "test1.md",
        date: "2024-01-01",
        keywords: "alpha, beta, gamma, alpha ",
        author: "Author 1",
        index: 1,
      },
      {
        title: "Test 2",
        filename: "test2.md",
        date: "2024-01-02",
        keywords: "delta, beta",
        author: "Author 2",
        index: 2,
      },
    ];

    const expectedOutput = [
      { Keyword: "alpha", Color: COLOR_LIST[0] },
      { Keyword: "beta", Color: COLOR_LIST[1] },
      { Keyword: "gamma", Color: COLOR_LIST[2] },
      { Keyword: "delta", Color: COLOR_LIST[3 % COLOR_LIST.length] },
    ];

    const result = generateKeywordColors(input);
    expect(result).toEqual(expectedOutput);
  });

  it("should handle cases where keywords are empty strings or contain only whitespace", () => {
    const input: FrontMatterUniversalType[] = [
      {
        title: "Test 1",
        filename: "test1.md",
        date: "2024-01-01",
        keywords: "  ,   , ",
        author: "Author 1",
        index: 1,
      },
      {
        title: "Test 2",
        filename: "test2.md",
        date: "2024-01-02",
        keywords: "",
        author: "Author 2",
        index: 2,
      },
    ];

    const result = generateKeywordColors(input);
    expect(result).toEqual([]);
  });

  it("should loop around COLOR_LIST if there are more unique keywords than colors", () => {
    const input: FrontMatterUniversalType[] = [
      {
        title: "Test 1",
        filename: "test1.md",
        date: "2024-01-01",
        keywords: "alpha, beta, gamma, delta, epsilon",
        author: "Author 1",
        index: 1,
      },
    ];

    const expectedOutput = [
      { Keyword: "alpha", Color: COLOR_LIST[0] },
      { Keyword: "beta", Color: COLOR_LIST[1] },
      { Keyword: "gamma", Color: COLOR_LIST[2] },
      { Keyword: "delta", Color: COLOR_LIST[3 % COLOR_LIST.length] },
      { Keyword: "epsilon", Color: COLOR_LIST[4 % COLOR_LIST.length] },
    ];

    const result = generateKeywordColors(input);
    expect(result).toEqual(expectedOutput);
  });
});
