import { ParsedLocation } from '@tanstack/react-router';
import { TransitionSettingTypes } from './settings';

/**
 * Type for transition classes, which maps each `TransitionOptions` value to an array of corresponding CSS class names that should be applied to the view during the transition. This type is used to define the specific CSS classes that will be used to implement the visual effects associated with each transition option, allowing for a clear and organized way to manage the styling of transitions within the application.
 */
export type Transitions = 'none' | 'slide-left' | 'slide-right';

/**
 * This constant defines the mapping of transition options to their corresponding CSS classes. Each key in the `TRANSITION_CLASSES` object corresponds to a `TransitionOptions` value, and the associated value is an array of CSS class names that should be applied to the view during the transition. This structure allows for a clear and organized way to manage the styling of transitions within the application, ensuring that the correct classes are applied based on the selected transition option.
 */
export const TRANSITION_CLASSES: Record<TransitionSettingTypes, string[]> = {
  none: [],
  slide: ['slide-left', 'slide-right'],
  fade: ['content-fade'],
};

/**
 * Type for view transition options, which defines the structure of the options that can be passed to the `viewTransitionCall` function to determine the behavior of view transitions in the application. The `ViewTransitionOptions` interface includes a `types` property, which can either be an array of strings representing CSS class names or a function that takes in location change information and returns an array of strings or false. This type is used to provide flexibility in defining transition behaviors based on specific conditions related to location changes within the application.
 */
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

/**
 * This function, `viewTransitionCall`, is used to determine the appropriate view transition options based on the selected transition behavior. It takes in a `transitionBehavior` parameter of type `TransitionOptions` and returns either a boolean value (false) to disable transitions or an object of type `ViewTransitionOptions` that specifies the CSS classes to be applied during the transition. The function uses a switch statement to handle different transition behaviors, providing specific logic for 'slide' transitions to determine the direction of the slide based on location changes, while 'none' and 'fade' transitions return predefined options. This function allows for dynamic configuration of view transitions in the application based on user preferences or other conditions.
 *
 * @param transitionBehavior - The selected transition behavior, which can be 'none', 'slide', or 'fade', determining the type of transition to be applied to view changes within the application.
 * @returns - A boolean value (false) to disable transitions or an object of type `ViewTransitionOptions` that specifies the CSS classes to be applied during the transition, based on the selected transition behavior.
 */
export function viewTransitionCall(
  transitionBehavior: TransitionSettingTypes,
): boolean | ViewTransitionOptions | undefined {
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
