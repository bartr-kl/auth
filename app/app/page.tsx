import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex justify-between items-center py-6">
          <div className="text-white text-2xl font-bold">Paddle Stacks</div>
          <div className="space-x-4">
            {user ? (
              <Link
                href="/admin"
                className="bg-white text-indigo-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-white hover:text-gray-200 font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-white text-indigo-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </nav>

        <main className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6">
            Welcome to Paddle Stacks
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl">
            Your complete platform for managing pickleball organizations, locations, and player communities.
          </p>
          <div className="space-x-4">
            {user ? (
              <Link
                href="/admin"
                className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100 transition"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100 transition"
                >
                  Get Started
                </Link>
                <Link
                  href="/login"
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-white/10 transition"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
