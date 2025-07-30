'use client';
import { useUser } from "@auth0/nextjs-auth0/client";

export default function HomePage() {
  const { user } = useUser();

  return (
    <main className="flex flex-col items-center justify-center h-screen bg-black text-white">
      {!user ? (
        <a
          href={`https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&response_type=code&scope=openid%20email%20profile`}
          className="px-6 py-3 bg-indigo-600 rounded hover:bg-indigo-700 text-lg"
        >
          Sign in with Google
        </a>
      ) : (
        <p className="text-xl">Welcome, {user.name}</p>
      )}
    </main>
  );
}

