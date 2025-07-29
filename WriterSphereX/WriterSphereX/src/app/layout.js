import "./globals.css";
import { UserProvider } from "@auth0/nextjs-auth0/client"; // ✅ Add this

export const metadata = {
  title: "WriterSphereX",
  description: "Your storytelling constellation",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <UserProvider> {/* ✅ Wrap your app */}
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
