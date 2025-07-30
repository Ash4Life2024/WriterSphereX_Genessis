<a href={...}>Sign in with Google</a>
import { useUser } from "@auth0/nextjs-auth0/client";

export default function HomePage() {
  const { user } = useUser();
  return (
    <main>...Login UI...</main>
  );
}

