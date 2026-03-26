export function LoadingDisplay() {
  return (
    <div className="flex items-center justify-center py-[10%]">
      <div className="flex space-x-2 justify-center items-center my-4">
        <span className="sr-only">Loading...</span>
        <div className="h-3 w-3 bg-blue-600 dark:bg-green-400 rounded-full animate-bounce [animation-delay:-0.45s]"></div>
        <div className="h-3 w-3 bg-blue-600 dark:bg-green-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="h-3 w-3 bg-blue-600 dark:bg-green-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="h-3 w-3 bg-blue-600 dark:bg-green-400 rounded-full animate-bounce"></div>
      </div>
    </div>
  );
}
