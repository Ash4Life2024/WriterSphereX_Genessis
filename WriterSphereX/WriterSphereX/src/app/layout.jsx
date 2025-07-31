import "./globals.css";
import { UserProvider } from "@auth0/nextjs-auth0/client"; // ✅ Import from Auth0 SDK

export const metadata = {
  title: "WriterSphereX",
  description: "Your storytelling constellation",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <UserProvider> {/* ✅ Wrap your whole app in Auth0 context */}
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
