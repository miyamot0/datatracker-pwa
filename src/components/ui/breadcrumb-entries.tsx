import { CleanUpString } from '@/lib/strings';

export function BuildDocumentationBreadcrumb() {
  return {
    to: '/documentation',
    label: 'Documentation',
  };
}

export function BuildGroupBreadcrumb() {
  return {
    to: '/dashboard',
    label: 'Group Dashboard',
  };
}

export function BuildIndividualsBreadcrumb(group: string) {
  return {
    to: `/session/${CleanUpString(group)}`,
    label: CleanUpString(group),
  };
}

export function BuildEvaluationsBreadcrumb(group: string, individual: string) {
  return {
    to: `/session/${CleanUpString(group)}/${CleanUpString(individual)}`,
    label: CleanUpString(individual),
  };
}

export function BuildSessionHistoryBreadcrumb(group: string, individual: string, evaluation: string) {
  return {
    to: `/session/${CleanUpString(group)}/${CleanUpString(individual)}/${CleanUpString(evaluation)}/history`,
    label: 'Session History',
  };
}

export function BuildSessionDesignerBreadcrumb(group: string, individual: string, evaluation: string) {
  return {
    to: `/session/${CleanUpString(group)}/${CleanUpString(individual)}/${CleanUpString(evaluation)}`,
    label: CleanUpString(evaluation),
  };
}

export function BuildKeysetBreadcrumb(group: string, individual: string) {
  return {
    to: `/session/${CleanUpString(group)}/${CleanUpString(individual)}/keysets`,
    label: 'Keysets',
  };
}
