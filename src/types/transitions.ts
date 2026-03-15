import { ParsedLocation } from '@tanstack/react-router';

export type TransitionOptions = 'none' | 'slide' | 'fade';

export const TRANSITION_OPTIONS: {
  value: TransitionOptions;
  label: string;
}[] = [
  { value: 'none', label: 'No Page Animation' },
  { value: 'slide', label: 'Left/Right Slide' },
  { value: 'fade', label: 'Fade In/Out' },
];

export type Transitions = 'none' | 'slide-left' | 'slide-right';

export const TRANSITION_CLASSES: Record<TransitionOptions, string[]> = {
  none: [],
  slide: ['slide-left', 'slide-right'],
  fade: ['content-fade'],
};

export interface ViewTransitionOptions {
  types:
    | Array<string>
    | ((locationChangeInfo: {
        fromLocation?: ParsedLocation;
        toLocation: ParsedLocation;
        pathChanged: boolean;
        hrefChanged: boolean;
        hashChanged: boolean;
      }) => Array<string> | false);
}

export function viewTransitionCall(transitionBehavior: TransitionOptions): boolean | ViewTransitionOptions | undefined {
  switch (transitionBehavior) {
    case 'none':
      return false;
    case 'slide': {
      return {
        types: ({
          fromLocation,
          toLocation,
        }: {
          fromLocation?: ParsedLocation;
          toLocation: ParsedLocation;
          pathChanged: boolean;
          hrefChanged: boolean;
          hashChanged: boolean;
        }) => {
          let direction = 'none';

          if (fromLocation) {
            const fromIndex = fromLocation.state.__TSR_index;
            const toIndex = toLocation.state.__TSR_index;
            if (fromIndex !== toIndex) {
              direction = fromIndex > toIndex ? 'right' : 'left';
            }
          }

          // Prevent animation when navigating to the same route
          if (fromLocation?.state.__TSR_index === toLocation?.state.__TSR_index) {
            direction = 'none';
          }

          return [`slide-${direction}`];
        },
      };
    }
    case 'fade':
      return {
        types: ['content-fade'],
      };
  }
}
