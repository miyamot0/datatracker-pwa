import { CleanUpString } from "./strings";

/**
 * Route information type guards
 */
type RouteInformationType =
  | {
      type: "Home";
    }
  | {
      type: "Documentation";
    }
  | {
      type: "Documentation Entry";
      slug: string;
    }
  | {
      type: "Dashboard";
    }
  | {
      type: "Settings";
    }
  | {
      type: "Individuals";
      group: string;
    }
  | {
      type: "Keysets";
      group: string;
      individual: string;
    }
  | {
      type: "Evaluations";
      group: string;
      individual: string;
    }
  | {
      type: "Session Designer";
      group: string;
      individual: string;
      evaluation: string;
    }
  | {
      type: "Evaluation Viewer";
      group: string;
      individual: string;
      evaluation: string;
    }
  | {
      type: "Reli Viewer";
      group: string;
      individual: string;
      evaluation: string;
    };

/**
 * Create route href
 *
 * @param route type of route
 * @returns
 */
export default function createHref(route: RouteInformationType) {
  const _ = CleanUpString;

  switch (route.type) {
    case "Home":
      return "/";
    case "Documentation":
      return "/documentation";
    case "Documentation Entry":
      return `/documentation/${route.slug}`;
    case "Dashboard":
      return "/dashboard";
    case "Settings":
      return "/settings";
    case "Individuals":
      return `/session/${_(route.group)}`;
    case "Evaluations":
      return `/session/${_(route.group)}/${_(route.individual)}`;
    case "Session Designer":
      return `/session/${_(route.group)}/${_(route.individual)}/${_(
        route.evaluation
      )}`;
    case "Evaluation Viewer":
      return `/session/${_(route.group)}/${_(route.individual)}/${_(
        route.evaluation
      )}/view`;
    case "Reli Viewer":
      return `/session/${_(route.group)}/${_(route.individual)}/${_(
        route.evaluation
      )}/reli`;
    case "Keysets":
      return `/session/${_(route.group)}/${_(route.individual)}/keysets`;
    default:
      return "/";
  }
}
