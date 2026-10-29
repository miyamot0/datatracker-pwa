import { describe, it, expect } from 'vitest';
import {
  BuildDocumentationBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildEvaluationsBreadcrumb,
  BuildSessionHistoryBreadcrumb,
  BuildSessionDesignerBreadcrumb,
  BuildKeysetBreadcrumb,
} from '../breadcrumb-entries';

describe('breadcrumb-entries', () => {
  it('builds the documentation and group dashboard crumbs', () => {
    expect(BuildDocumentationBreadcrumb()).toEqual({ to: '/documentation', label: 'Documentation' });
    expect(BuildGroupBreadcrumb()).toEqual({ to: '/dashboard', label: 'Group Dashboard' });
  });

  it('builds the individuals crumb with encoded spaces decoded in the label and path', () => {
    expect(BuildIndividualsBreadcrumb('Group%20One')).toEqual({
      to: '/session/Group One',
      label: 'Group One',
    });
  });

  it('builds the evaluations crumb from group and individual', () => {
    expect(BuildEvaluationsBreadcrumb('Group%20One', 'Ind%20Two')).toEqual({
      to: '/session/Group One/Ind Two',
      label: 'Ind Two',
    });
  });

  it('builds the session history crumb', () => {
    expect(BuildSessionHistoryBreadcrumb('G', 'I', 'E%20X')).toEqual({
      to: '/session/G/I/E X/history',
      label: 'Session History',
    });
  });

  it('builds the session designer crumb labelled with the evaluation', () => {
    expect(BuildSessionDesignerBreadcrumb('G', 'I', 'E%20X')).toEqual({
      to: '/session/G/I/E X',
      label: 'E X',
    });
  });

  it('builds the keysets crumb', () => {
    expect(BuildKeysetBreadcrumb('G', 'I%20J')).toEqual({
      to: '/session/G/I J/keysets',
      label: 'Keysets',
    });
  });
});
