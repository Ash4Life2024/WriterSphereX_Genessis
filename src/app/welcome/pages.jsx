import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
export default function WelcomePage() {
  return (
    <main className="flex flex-col items-center justify-center h-screen text-white">
      <h1 className="text-3xl font-bold mb-4">Welcome to WriterSphereX ✨</h1>
      <p className="text-lg mb-8">Initializing emotional orbit... choose your genre to begin.</p>

      {/* Genre selection buttons */}
      <div className="flex gap-4">
        <button className="bg-purple-600 px-4 py-2 rounded">Fantasy</button>
        <button className="bg-green-600 px-4 py-2 rounded">Drama</button>
        <button className="bg-indigo-600 px-4 py-2 rounded">Sci-Fi</button>
      </div>
    </main>
  );
}
