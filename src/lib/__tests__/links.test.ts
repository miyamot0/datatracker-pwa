import createHref, { RouteInformationType } from '../links';
import { CleanUpString } from '../strings';

// Mock CleanUpString function
vi.mock('../strings', () => ({
  CleanUpString: vi.fn((str: string) => str),
}));

describe('createHref', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return "/" for Home route', () => {
    const route = { type: 'Home' } as RouteInformationType;
    const href = createHref(route);
    expect(href).toBe('/');
  });

  it('should return "/documentation" for Documentation route', () => {
    const route = { type: 'Documentation' } as RouteInformationType;
    const href = createHref(route);
    expect(href).toBe('/documentation');
  });

  it('should return correct URL for Documentation Entry route', () => {
    const route = { type: 'Documentation Entry', slug: 'my-doc' } as RouteInformationType;
    const href = createHref(route);
    expect(href).toBe('/documentation/my-doc');
  });

  it('should return "/dashboard" for Dashboard route', () => {
    const route = { type: 'Dashboard' } as RouteInformationType;
    const href = createHref(route);
    expect(href).toBe('/dashboard');
  });

  it('should return "/settings" for Settings route', () => {
    const route = { type: 'Settings' } as RouteInformationType;
    const href = createHref(route);
    expect(href).toBe('/settings');
  });

  it('should return correct URL for Individuals route', () => {
    const route = { type: 'Individuals', group: 'group1' } as RouteInformationType;
    const href = createHref(route);
    expect(CleanUpString).toHaveBeenCalledWith('group1');
    expect(href).toBe('/session/group1');
  });

  it('should return correct URL for Evaluations route', () => {
    const route = { type: 'Evaluations', group: 'group1', individual: 'individual1' } as RouteInformationType;
    const href = createHref(route);
    expect(CleanUpString).toHaveBeenCalledWith('group1');
    expect(CleanUpString).toHaveBeenCalledWith('individual1');
    expect(href).toBe('/session/group1/individual1');
  });

  it('should return correct URL for Session Designer route', () => {
    const route = {
      type: 'Session Designer',
      group: 'group1',
      individual: 'individual1',
      evaluation: 'evaluation1',
    } as RouteInformationType;
    const href = createHref(route);
    expect(CleanUpString).toHaveBeenCalledWith('group1');
    expect(CleanUpString).toHaveBeenCalledWith('individual1');
    expect(CleanUpString).toHaveBeenCalledWith('evaluation1');
    expect(href).toBe('/session/group1/individual1/evaluation1');
  });

  it('should return correct URL for Evaluation Viewer route', () => {
    const route = {
      type: 'Evaluation Viewer',
      group: 'group1',
      individual: 'individual1',
      evaluation: 'evaluation1',
    } as RouteInformationType;
    const href = createHref(route);
    expect(href).toBe('/session/group1/individual1/evaluation1/view');
  });

  it('should return correct URL for Evaluation Session Viewer route', () => {
    const route = {
      type: 'Evaluation Session Viewer',
      group: 'group1',
      individual: 'individual1',
      evaluation: 'evaluation1',
    } as RouteInformationType;
    const href = createHref(route);
    expect(href).toBe('/session/group1/individual1/evaluation1/history');
  });

  it('should return correct URL for Evaluation Session Analysis route', () => {
    const route = {
      type: 'Evaluation Session Analysis',
      group: 'group1',
      individual: 'individual1',
      evaluation: 'evaluation1',
      index: '123',
    } as RouteInformationType;
    const href = createHref(route);
    expect(href).toBe('/session/group1/individual1/evaluation1/history/123');
  });

  it('should return correct URL for Evaluation Visualizer-Rate route', () => {
    const route = {
      type: 'Evaluation Visualizer-Rate',
      group: 'group1',
      individual: 'individual1',
      evaluation: 'evaluation1',
    } as RouteInformationType;
    const href = createHref(route);
    expect(href).toBe('/session/group1/individual1/evaluation1/rate');
  });

  it('should return correct URL for Evaluation Visualizer-Proportion route', () => {
    const route = {
      type: 'Evaluation Visualizer-Proportion',
      group: 'group1',
      individual: 'individual1',
      evaluation: 'evaluation1',
    } as RouteInformationType;
    const href = createHref(route);
    expect(href).toBe('/session/group1/individual1/evaluation1/proportion');
  });

  it('should return correct URL for Reli Viewer route', () => {
    const route = {
      type: 'Reli Viewer',
      group: 'group1',
      individual: 'individual1',
      evaluation: 'evaluation1',
    } as RouteInformationType;
    const href = createHref(route);
    expect(href).toBe('/session/group1/individual1/evaluation1/reli');
  });

  it('should return correct URL for Keysets route', () => {
    const route = {
      type: 'Keysets',
      group: 'group1',
      individual: 'individual1',
    } as RouteInformationType;
    const href = createHref(route);
    expect(href).toBe('/session/group1/individual1/keysets');
  });

  it('should return "/" for unknown route type', () => {
    // @ts-expect-error - Testing a route not in the type definition
    const route = { type: 'UnknownRoute' } as RouteInformationType;
    const href = createHref(route);
    expect(href).toBe('/');
  });
});
