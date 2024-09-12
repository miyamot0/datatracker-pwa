export default function LoadingDisplay() {
  return (
    <div className="flex flex-col items-center justify-center h-[100vh]">
      <div className="animate-spin rounded-full h-24 w-24 border-t-0 border-b-2 border-gray-900 dark:border-gray-400"></div>
      <div className="mt-4 text-lg font-bold text-gray-900 dark:text-gray-400">
        Loading content...
      </div>
    </div>
  );
}
