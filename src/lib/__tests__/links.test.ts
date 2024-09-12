import createHref from '../links';

describe('createHref', () => {
  it('should return "/" for "Home" route type', () => {
    const result = createHref({ type: 'Home' });
    expect(result).toBe('/');
  });

  it('should return "/documentation" for "Documentation" route type', () => {
    const result = createHref({ type: 'Documentation' });
    expect(result).toBe('/documentation');
  });

  it('should return the correct URL for "Documentation Entry" route type', () => {
    const result = createHref({
      type: 'Documentation Entry',
      slug: 'getting-started',
    });
    expect(result).toBe('/documentation/getting-started');
  });

  it('should return "/dashboard" for "Dashboard" route type', () => {
    const result = createHref({ type: 'Dashboard' });
    expect(result).toBe('/dashboard');
  });

  it('should return "/settings" for "Settings" route type', () => {
    const result = createHref({ type: 'Settings' });
    expect(result).toBe('/settings');
  });

  it('should return the correct URL for "Individuals" route type', () => {
    const result = createHref({ type: 'Individuals', group: 'Group1' });
    expect(result).toBe('/session/Group1');
  });

  it('should return the correct URL for "Evaluations" route type', () => {
    const result = createHref({
      type: 'Evaluations',
      group: 'Group1',
      individual: 'Ind1',
    });
    expect(result).toBe('/session/Group1/Ind1');
  });

  it('should return the correct URL for "Session Designer" route type', () => {
    const result = createHref({
      type: 'Session Designer',
      group: 'Group1',
      individual: 'Ind1',
      evaluation: 'Eval1',
    });
    expect(result).toBe('/session/Group1/Ind1/Eval1');
  });

  it('should return the correct URL for "Evaluation Viewer" route type', () => {
    const result = createHref({
      type: 'Evaluation Viewer',
      group: 'Group1',
      individual: 'Ind1',
      evaluation: 'Eval1',
    });
    expect(result).toBe('/session/Group1/Ind1/Eval1/view');
  });

  it('should return the correct URL for "Reli Viewer" route type', () => {
    const result = createHref({
      type: 'Reli Viewer',
      group: 'Group1',
      individual: 'Ind1',
      evaluation: 'Eval1',
    });
    expect(result).toBe('/session/Group1/Ind1/Eval1/reli');
  });

  it('should return the correct URL for "Keysets" route type', () => {
    const result = createHref({
      type: 'Keysets',
      group: 'Group1',
      individual: 'Ind1',
    });
    expect(result).toBe('/session/Group1/Ind1/keysets');
  });

  it('should return "/" for an unknown route type', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = createHref({ type: 'Unknown' as any });
    expect(result).toBe('/');
  });
});
