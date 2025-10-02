export function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center z-50">
      <div className="text-center animate-fade-in">
        {/* Logo/Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl animate-bounce-slow">
            <svg
              className="w-14 h-14 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>
        </div>

        {/* App Name */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
          HOA Manager
        </h1>
        <p className="text-xl text-blue-100 font-medium mb-8">
          Simplify Your Community
        </p>

        {/* Loading Spinner */}
        <div className="flex justify-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-white rounded-full animate-spin"></div>
        </div>

        {/* Loading Text */}
        <p className="text-blue-100 mt-4 text-sm">Loading your HOA data...</p>
      </div>
    </div>
  );
}
