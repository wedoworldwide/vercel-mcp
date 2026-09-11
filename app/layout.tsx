export const metadata = {
  title: 'vercel-mcp',
  description: 'Hosted Vercel MCP server for WE-DO agents',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
