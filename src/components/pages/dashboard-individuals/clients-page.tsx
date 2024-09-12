"use client";

import PageWrapper from "@/components/layout/page-wrapper";
import { BuildGroupBreadcrumb } from "@/components/ui/breadcrumb-entries";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LoadingDisplay from "@/components/ui/loading-display";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from "@/components/ui/table";
import ToolTipWrapper from "@/components/ui/tooltip-wrapper";
import { FolderHandleContext } from "@/context/folder-context";
import { getIndividualClientFolders, removeClientFolder } from "@/lib/files";
import createHref from "@/lib/links";
import { displayConditionalNotification } from "@/lib/notifications";
import { CleanUpString } from "@/lib/strings";
import { cn } from "@/lib/utils";
import { LoadingStructure } from "@/types/working";
import { ChevronDown, FolderInput, FolderPlus, FolderX } from "lucide-react";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";

type Props = {
  Handle: FileSystemDirectoryHandle;
  Group: string;
};

export default function ClientsPage({ Handle, Group }: Props) {
  const { settings } = useContext(FolderHandleContext);
  const [individuals, setIndividuals] = useState<LoadingStructure>({
    Status: "loading",
    Values: [],
  });

  useEffect(() => {
    getIndividualClientFolders(Handle, Group, setIndividuals);
  }, [Handle, Group]);

  if (individuals.Status === "loading") {
    return <LoadingDisplay />;
  }

  return (
    <PageWrapper
      breadcrumbs={[BuildGroupBreadcrumb()]}
      label={CleanUpString(Group)}
    >
      <Card className="w-full max-w-screen-2xl">
        <CardHeader className="flex flex-col md:flex-row w-full justify-between">
          <div className="flex flex-col gap-1.5">
            <CardTitle>Client Group: {CleanUpString(Group)}</CardTitle>
            <CardDescription>
              Select clients to develop and evaluate outcomes
            </CardDescription>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <ToolTipWrapper Label="Add a new client to current group">
              <Button
                variant={"outline"}
                className="shadow"
                onClick={async () => {
                  const input = window.prompt(
                    "Enter a name for the new group."
                  );

                  if (!input || !Handle) return;

                  if (individuals.Values.includes(input)) {
                    window.alert("Client already exists.");
                    return;
                  }

                  if (input.trim().length < 4) {
                    window.alert(
                      "Client name must be at least 4 characters long."
                    );
                    return;
                  }

                  const group_dir = await Handle.getDirectoryHandle(
                    CleanUpString(Group)
                  );
                  await group_dir.getDirectoryHandle(input, { create: true });

                  const new_state = {
                    ...individuals,
                    Values: [...individuals.Values, input],
                  };

                  setIndividuals(new_state);

                  displayConditionalNotification(
                    settings,
                    "New Individual Created",
                    "A folder for the new individual has been created."
                  );
                }}
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                Create Individual
              </Button>
            </ToolTipWrapper>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-1.5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Information</TableHead>
                <TableHead className="text-right">
                  Client Folder Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {individuals.Values.map((id, index) => (
                <TableRow key={index} className="my-2">
                  <TableCell>{id}</TableCell>
                  <TableCell className="flex flex-row justify-end">
                    <Button
                      size={"sm"}
                      variant={"outline"}
                      className="flex flex-row divide-x justify-between mx-0 px-0 shadow"
                    >
                      <Link
                        className="px-3 hover:underline flex flex-row items-center"
                        href={createHref({
                          type: "Evaluations",
                          group: Group,
                          individual: id,
                        })}
                      >
                        <FolderInput className="mr-2 h-4 w-4" />
                        Open Evaluations
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <ChevronDown className="w-fit px-2" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          className="w-56"
                          side="bottom"
                          align="end"
                          sideOffset={12}
                        >
                          <DropdownMenuLabel>Data Management</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className={cn(
                              "bg-red-500 text-white hover:bg-red-400 focus:bg-red-400 focus:text-white rounded cursor-pointer",
                              {
                                disabled: settings.EnableFileDeletion === false,
                                "pointer-events-none":
                                  settings.EnableFileDeletion === false,
                              }
                            )}
                            disabled={settings.EnableFileDeletion === false}
                            onClick={async () => {
                              const confirm_delete = window.confirm(
                                "Are you sure you want to delete this client? This CANNOT be undone."
                              );

                              if (confirm_delete) {
                                try {
                                  await removeClientFolder(
                                    Handle,
                                    CleanUpString(Group),
                                    CleanUpString(id)
                                  );

                                  const new_state = {
                                    ...individuals,
                                    Values: individuals.Values.filter(
                                      (item) => item !== id
                                    ),
                                  };

                                  setIndividuals(new_state);

                                  displayConditionalNotification(
                                    settings,
                                    "Client Data Deleted",
                                    "Client data has been successfully deleted."
                                  );
                                } catch (error) {
                                  displayConditionalNotification(
                                    settings,
                                    "Client Data Deletion Error",
                                    "An error occurred while deleting the client data.",
                                    3000,
                                    true
                                  );
                                }
                              }
                            }}
                          >
                            <FolderX className="mr-2 h-4 w-4" />
                            Remove Client
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
