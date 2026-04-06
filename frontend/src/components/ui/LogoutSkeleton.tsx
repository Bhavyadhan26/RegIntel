export const LogoutSkeleton = () => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="flex flex-col items-center gap-4">
        {/* Logo skeleton */}
        <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full animate-pulse" />
        
        {/* Text skeleton */}
        <div className="space-y-2 text-center">
          <div className="h-6 w-48 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full animate-pulse" />
          <div className="h-4 w-64 bg-gradient-to-r from-gray-100 to-gray-50 rounded-full animate-pulse" />
        </div>

        {/* Loading bar */}
        <div className="w-72 h-2 bg-gray-200 rounded-full overflow-hidden mt-4">
          <div className="h-full bg-gradient-to-r from-primary/0 via-primary to-primary/0 animate-shimmer" />
        </div>
      </div>
    </div>
  );
};
