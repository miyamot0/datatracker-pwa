export type AnalyticsEventMap = {
  app_error: {
    message: string;
    stack?: string;
    fatal?: boolean;
  };

  page_view: {
    path: string;
    title?: string;
  };

  user_action: {
    action: 'click' | 'submit' | 'navigate';
    label?: string;
  };

  api_error: {
    endpoint: string;
    status: number;
    message?: string;
  };
};

export type EventName = keyof AnalyticsEventMap;

export type EventPayload<T extends EventName = EventName> = {
  name: T;
  params: AnalyticsEventMap[T];
  timestamp: number;
};
