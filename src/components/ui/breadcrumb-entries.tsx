import createHref from "@/lib/links";
import { CleanUpString } from "@/lib/strings";

export function BuildDocumentationBreadcrumb() {
  return {
    href: createHref({ type: "Documentation" }),
    label: "Documentation",
  };
}

export function BuildGroupBreadcrumb() {
  return {
    href: createHref({ type: "Dashboard" }),
    label: "Group Dashboard",
  };
}

export function BuildIndividualsBreadcrumb(group: string) {
  return {
    href: createHref({ type: "Individuals", group }),
    label: CleanUpString(group),
  };
}

export function BuildEvaluationsBreadcrumb(group: string, individual: string) {
  return {
    href: createHref({ type: "Evaluations", group, individual }),
    label: CleanUpString(individual),
  };
}

export function BuildSessionDesignerBreadcrumb(
  group: string,
  individual: string,
  evaluation: string
) {
  return {
    href: createHref({
      type: "Session Designer",
      group,
      individual,
      evaluation,
    }),
    label: CleanUpString(evaluation),
  };
}

export function BuildKeysetBreadcrumb(group: string, individual: string) {
  return {
    href: createHref({ type: "Keysets", group, individual }),
    label: "Keysets",
  };
}
