/**
 * Route information type guards
 */
export type RouteInformationType =
  | {
      type: 'Home';
    }
  | {
      type: 'Documentation';
    }
  | {
      type: 'Documentation Entry';
      slug: string;
    }
  | {
      type: 'Dashboard';
    }
  | {
      type: 'Settings';
    }
  | {
      type: 'Individuals';
      group: string;
    }
  | {
      type: 'Keysets';
      group: string;
      individual: string;
    }
  | {
      type: 'Evaluations';
      group: string;
      individual: string;
    }
  | {
      type: 'Evaluations Import';
      group: string;
      individual: string;
    }
  | {
      type: 'Session Designer';
      group: string;
      individual: string;
      evaluation: string;
    }
  | {
      type: 'Evaluation Viewer';
      group: string;
      individual: string;
      evaluation: string;
    }
  | {
      type: 'Evaluation Session Viewer';
      group: string;
      individual: string;
      evaluation: string;
    }
  | {
      type: 'Evaluation Session Analysis';
      group: string;
      individual: string;
      evaluation: string;
      index: string;
    }
  | {
      type: 'Evaluation Session Manager';
      group: string;
      individual: string;
      evaluation: string;
      index: string;
    }
  | {
      type: 'Evaluation Visualizer-Rate';
      group: string;
      individual: string;
      evaluation: string;
    }
  | {
      type: 'Evaluation Visualizer-Proportion';
      group: string;
      individual: string;
      evaluation: string;
    }
  | {
      type: 'Reli Viewer';
      group: string;
      individual: string;
      evaluation: string;
    }
  | {
      type: 'Sync Page';
    };

/**
 * Create route href
 *
 * @param route type of route
 * @returns
 */
export default function createHref(route: RouteInformationType) {
  //const _ = CleanUpString;

  switch (route.type) {
    //case 'Home':
    //  return '/';
    case 'Documentation':
      return '/documentation';
    case 'Documentation Entry':
      return `/documentation/${route.slug}`;
    case 'Dashboard':
      return '/dashboard';
    case 'Settings':
      return '/settings';
    case 'Individuals':
      return `/session/${route.group}`;
    case 'Evaluations':
      return `/session/${route.group}/${route.individual}`;
    case 'Evaluations Import':
      return `/session/${route.group}/${route.individual}/import`;
    case 'Session Designer':
      return `/session/${route.group}/${route.individual}/${route.evaluation}`;
    case 'Evaluation Viewer':
      return `/session/${route.group}/${route.individual}/${route.evaluation}/view`;
    case 'Evaluation Session Viewer':
      return `/session/${route.group}/${route.individual}/${route.evaluation}/history`;
    case 'Evaluation Session Analysis':
      return `/session/${route.group}/${route.individual}/${route.evaluation}/history/${route.index}`;
    case 'Evaluation Session Manager':
      return `/session/${route.group}/${route.individual}/${route.evaluation}/history/edit/${route.index}`;
    case 'Evaluation Visualizer-Rate':
      return `/session/${route.group}/${route.individual}/${route.evaluation}/rate`;
    case 'Evaluation Visualizer-Proportion':
      return `/session/${route.group}/${route.individual}/${route.evaluation}/proportion`;
    case 'Reli Viewer':
      return `/session/${route.group}/${route.individual}/${route.evaluation}/reli`;
    case 'Keysets':
      return `/session/${route.group}/${route.individual}/keysets`;
    case 'Sync Page':
      return '/dashboard/sync';
    default:
      return '/';
  }
}
