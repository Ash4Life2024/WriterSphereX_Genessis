import { useUser } from "@auth0/nextjs-auth0/client";

export default function HomePage() {
  const { user } = useUser();

  return (
    <main className="flex flex-col items-center justify-center h-screen">
      {!user ? (
        <a href="/api/auth/login" className="text-blue-500 underline text-lg">
          Sign in to WriterSphereX
        </a>
      ) : (
        <p className="text-white text-xl">Welcome, {user.name}</p>
      )}
    </main>
  );
}
