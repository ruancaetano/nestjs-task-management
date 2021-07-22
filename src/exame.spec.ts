function addNumbers(a, b) {
  return a + b;
}

describe('Example test', () => {
  it('should adds two nubers', () => {
    const result = addNumbers(1, 1);
    expect(result).toEqual(2);
  });
});
