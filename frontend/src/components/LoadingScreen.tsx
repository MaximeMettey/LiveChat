export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mx-auto mb-4"></div>
        <h2 className="text-white text-xl font-semibold">LiveChat</h2>
        <p className="text-primary-100 mt-2">Chargement...</p>
      </div>
    </div>
  );
}
