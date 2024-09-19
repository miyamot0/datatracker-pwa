import { Fragment } from "react";
import { ExpandedSavedSessionResult } from "../session-viewer-page";

type Props = {
  Session: ExpandedSavedSessionResult | undefined;
};

export default function SessionKeyList({ Session }: Props) {
  if (!Session) return <></>;

  return (
    <>
      {Session.PlottedKeys.sort(
        (a, b) => a.TimeIntoSession - b.TimeIntoSession
      ).map((k, index) => {
        return (
          <Fragment key={index}>
            <div>{`${k.KeyDescription} (${k.KeyName} key)`}</div>
            <div>{k.KeyScheduleRecording}</div>
            <div>{k.KeyType}</div>
            <div>{`${k.TimeIntoSession.toFixed(2)}s (${(
              k.TimeIntoSession / 60
            ).toFixed(2)} min)`}</div>
          </Fragment>
        );
      })}
    </>
  );
}
