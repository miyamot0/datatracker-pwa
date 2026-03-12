export type RouterHandle = {
  setHandle: (_handle: FileSystemDirectoryHandle) => void;
  handle?: FileSystemDirectoryHandle;
};

export const routerHandle: RouterHandle = {
  handle: undefined,
  setHandle: (_handle: FileSystemDirectoryHandle) => {
    routerHandle.handle = _handle;
  },
};
