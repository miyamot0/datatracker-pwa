export function ErrorDisplay({ Text }: { Text?: string }) {
  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-red-500 text-lg">{Text || 'An error occurred while loading the data.'}</p>
    </div>
  );
}
