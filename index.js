// pages/index.js (for Next.js)
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white font-sans flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-5xl font-bold mb-6">🚀 WriterSphereX</h1>
      <p className="text-xl max-w-2xl mb-8">
        The AI-powered creation suite for authors, screenwriters, and game developers.
      </p>
      <a
        href="#"
        className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-full font-semibold transition"
      >
        Launch App
      </a>
      <div className="mt-10 text-sm opacity-60">
        © 2025 WriterSphereX. All Rights Reserved.
      </div>
    </div>
  );
}

