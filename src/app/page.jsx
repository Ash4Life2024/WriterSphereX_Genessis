{!user ? (
  <a href="/api/auth/login" className="text-blue-500 underline text-lg">
    Sign in to WriterSphereX
  </a>
) : (
  <p className="text-white text-xl">Welcome, {user.name}</p>
)}
