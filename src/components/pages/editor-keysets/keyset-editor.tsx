import PageWrapper from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { KeySet, KeySetInstance } from "@/types/keyset";
import { useContext, useEffect, useState } from "react";
import DurationDialogKeyCreator from "./dialogs/duration-dialog";
import { GetHandleKeyboardsFolder } from "@/lib/files";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import FrequencyDialogKeyCreator from "./dialogs/frequency-dialog";
import { DeleteIcon } from "lucide-react";
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildKeysetBreadcrumb,
} from "@/components/ui/breadcrumb-entries";
import { displayConditionalNotification } from "@/lib/notifications";
import { FolderHandleContext } from "@/context/folder-context";
import { serializeKeySet } from "@/lib/keyset";

type Props = {
  Handle: FileSystemDirectoryHandle;
  Group: string;
  Individual: string;
  KeySetFileName: string;
  KeySetState: KeySet;
};

export default function KeySetEditor({
  Handle,
  Group,
  Individual,
  KeySetFileName,
  KeySetState,
}: Props) {
  const { settings } = useContext(FolderHandleContext);
  const [keyset, setKeyset] = useState<KeySet>(KeySetState);

  async function addKeySetCallback(
    new_key: KeySetInstance,
    type: "Duration" | "Frequency"
  ) {
    let new_state = {
      ...keyset,
    };

    if (type === "Duration") {
      new_state = {
        ...new_state,
        DurationKeys: [...keyset.DurationKeys, new_key],
      };
    } else {
      new_state = {
        ...new_state,
        FrequencyKeys: [...keyset.FrequencyKeys, new_key],
      };
    }

    try {
      const keyboards_folder = await GetHandleKeyboardsFolder(
        Handle,
        Group,
        Individual
      );

      const key_board = await keyboards_folder.getFileHandle(
        `${KeySetFileName}.json`
      );

      const writer = await key_board.createWritable();
      await writer.write(serializeKeySet(new_state));
      await writer.close();

      setKeyset(new_state);

      displayConditionalNotification(
        settings,
        "KeySet Updated",
        "The current key set has been saved to file."
      );
    } catch (e) {
      console.error(e);

      displayConditionalNotification(
        settings,
        "Error Updating Keys",
        "There was an error mutating the keyset",
        3000,
        true
      );
    }
  }

  async function mutateKeySet(new_keyset: KeySet) {
    try {
      const keyboards_folder = await GetHandleKeyboardsFolder(
        Handle,
        Group,
        Individual
      );

      const key_board = await keyboards_folder.getFileHandle(
        `${KeySetFileName}.json`
      );

      const writer = await key_board.createWritable();
      await writer.write(serializeKeySet(new_keyset));
      await writer.close();

      setKeyset(new_keyset);

      displayConditionalNotification(
        settings,
        "KeySet Updated",
        "The current key set has been saved to file."
      );
    } catch (e) {
      console.error(e);

      displayConditionalNotification(
        settings,
        "Error Updating Keys",
        "There was an error mutating the keyset",
        3000,
        true
      );
    }
  }

  useEffect(() => {
    setKeyset(KeySetState);
  }, [KeySetState]);

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
        BuildKeysetBreadcrumb(Group, Individual),
      ]}
      label={KeySetFileName}
    >
      <div className="w-full max-w-screen-2xl grid grid-cols-2 gap-2">
        <Card className="w-full flex flex-col justify-between">
          <CardHeader className="flex flex-col md:flex-row justify-between">
            <div className="flex flex-col gap-1.5">
              <CardTitle>Frequency Keys</CardTitle>
              <CardDescription>Manage Frequency Keys</CardDescription>
            </div>

            <FrequencyDialogKeyCreator
              KeySet={keyset}
              Callback={addKeySetCallback}
            />
          </CardHeader>
          <CardContent className="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead className="w-[50px] text-right">Editor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keyset.FrequencyKeys.map((key, index) => (
                  <TableRow key={index}>
                    <TableCell>{key.KeyDescription}</TableCell>
                    <TableCell>{key.KeyName}</TableCell>
                    <TableCell>
                      <Button
                        size={"sm"}
                        variant={"destructive"}
                        className="shadow-xl"
                        onClick={() => {
                          const confirmation = window.confirm(
                            "Are you sure you want to remove this key?"
                          );

                          if (!confirmation) return;

                          const new_state = {
                            ...keyset,
                            FrequencyKeys: keyset.FrequencyKeys.filter(
                              (_key) => _key.KeyCode !== key.KeyCode
                            ),
                          };

                          mutateKeySet(new_state);
                        }}
                      >
                        <DeleteIcon className="mr-2" />
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="w-full flex flex-col justify-between">
          <CardHeader className="flex flex-col md:flex-row justify-between">
            <div className="flex flex-col gap-1.5">
              <CardTitle>Duration Keys</CardTitle>
              <CardDescription>Manage Duration Keys</CardDescription>
            </div>
            <DurationDialogKeyCreator
              KeySet={keyset}
              Callback={addKeySetCallback}
            />
          </CardHeader>
          <CardContent className="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead className="w-[50px] text-right">Editor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keyset.DurationKeys.map((key, index) => (
                  <TableRow key={index}>
                    <TableCell>{key.KeyDescription}</TableCell>
                    <TableCell>{key.KeyName}</TableCell>
                    <TableCell>
                      <Button
                        size={"sm"}
                        variant={"destructive"}
                        onClick={() => {
                          const confirmation = window.confirm(
                            "Are you sure you want to remove this key?"
                          );

                          if (!confirmation) return;

                          const new_state = {
                            ...keyset,
                            DurationKeys: keyset.DurationKeys.filter(
                              (_key) => _key.KeyCode !== key.KeyCode
                            ),
                          };

                          mutateKeySet(new_state);
                        }}
                      >
                        <DeleteIcon className="mr-2" />
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
