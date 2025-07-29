<a
  href={`https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&response_type=code&scope=openid%20email%20profile`}
  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
>
  Sign in with Google
</a>
