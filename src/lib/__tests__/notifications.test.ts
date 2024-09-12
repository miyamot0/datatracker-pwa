import { displayConditionalNotification } from "../notifications";
import { toast } from "sonner";
import { ApplicationSettingsTypes } from "../../types/settings";

// Mock the toast functions
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("displayConditionalNotification", () => {
  const defaultSettings: ApplicationSettingsTypes = {
    PostSessionBx: "AwaitInput",
    NotificationSettings: "ShowAll",
    EnableFileDeletion: false,
    EnforceDataFolderName: true,
    EnableToolTip: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should display an error notification when isError is true", () => {
    displayConditionalNotification(
      defaultSettings,
      "Error Title",
      "Error Description",
      3000,
      true
    );

    expect(toast.error).toHaveBeenCalledWith("Error Title", {
      description: "Error Description",
      duration: 3000,
    });
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('should display a success notification when isError is false and NotificationSettings is "ShowAll"', () => {
    displayConditionalNotification(
      defaultSettings,
      "Success Title",
      "Success Description",
      3000,
      false
    );

    expect(toast.success).toHaveBeenCalledWith("Success Title", {
      description: "Success Description",
      duration: 3000,
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should not display a notification when NotificationSettings is "ShowNone"', () => {
    const settings = { ...defaultSettings, NotificationSettings: "ShowNone" };

    displayConditionalNotification(
      settings,
      "Success Title",
      "Success Description",
      3000,
      false
    );

    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should not display a notification when NotificationSettings is "ShowErrorsOnly" and isError is false', () => {
    const settings = {
      ...defaultSettings,
      NotificationSettings: "ShowErrorsOnly",
    };

    displayConditionalNotification(
      settings,
      "Success Title",
      "Success Description",
      3000,
      false
    );

    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should display an error notification when NotificationSettings is "ShowErrorsOnly" and isError is true', () => {
    const settings = {
      ...defaultSettings,
      NotificationSettings: "ShowErrorsOnly",
    };

    displayConditionalNotification(
      settings,
      "Error Title",
      "Error Description",
      3000,
      true
    );

    expect(toast.error).toHaveBeenCalledWith("Error Title", {
      description: "Error Description",
      duration: 3000,
    });
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("should display a success notification with default duration when duration is not provided", () => {
    displayConditionalNotification(
      defaultSettings,
      "Success Title",
      "Success Description",
      undefined,
      false
    );

    expect(toast.success).toHaveBeenCalledWith("Success Title", {
      description: "Success Description",
      duration: undefined, // since duration is optional and not provided
    });
    expect(toast.error).not.toHaveBeenCalled();
  });
});
