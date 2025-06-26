export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Welcome to Heinicus Mobile Mechanic
            </h2>
            <p className="text-gray-600 mb-6">
              AI-powered mobile mechanic services at your location
            </p>
            <div className="space-y-2">
              <p className="text-sm text-green-600">✅ Prisma Schema: Fixed</p>
              <p className="text-sm text-green-600">✅ Next.js Structure: Created</p>
              <p className="text-sm text-green-600">✅ Environment: Configured</p>
              <p className="text-sm text-blue-600">🔄 Phase 1 Complete - Ready for Phase 2</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}