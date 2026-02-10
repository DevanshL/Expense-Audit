export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-5xl font-bold text-blue-700 mb-4">404</h1>
      <p className="text-xl text-gray-700 mb-6">Page Not Found</p>
      <a href="/" className="text-blue-600 hover:underline">Go to Home</a>
    </div>
  );
}
