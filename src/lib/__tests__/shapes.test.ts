import { getShape } from "../shapes"; // Adjust the import path

describe("getShape", () => {
  it("should return 'circle' for index 0", () => {
    expect(getShape(0)).toBe("circle");
  });

  it("should return 'cross' for index 1", () => {
    expect(getShape(1)).toBe("cross");
  });

  it("should return 'diamond' for index 2", () => {
    expect(getShape(2)).toBe("diamond");
  });

  it("should return 'square' for index 3", () => {
    expect(getShape(3)).toBe("square");
  });

  it("should return 'star' for index 4", () => {
    expect(getShape(4)).toBe("star");
  });

  it("should return 'triangle' for index 5", () => {
    expect(getShape(5)).toBe("triangle");
  });

  it("should return 'wye' for index 6", () => {
    expect(getShape(6)).toBe("wye");
  });

  it("should return 'circle' for index 7", () => {
    expect(getShape(7)).toBe("circle");
  });

  it("should return 'cross' for index 8", () => {
    expect(getShape(8)).toBe("cross");
  });

  it("should return 'diamond' for index 9", () => {
    expect(getShape(9)).toBe("diamond");
  });
});
