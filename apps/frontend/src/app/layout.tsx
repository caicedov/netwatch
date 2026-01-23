/**
 * Root Layout
 *
 * Main layout for all pages.
 */

export const metadata = {
  title: 'NetWatch',
  description: 'Real-time multiplayer hacking game',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
