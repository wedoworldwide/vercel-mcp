export default function Home() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '3rem', maxWidth: '42rem' }}>
      <h1>vercel-mcp</h1>
      <p>
        Hosted Vercel MCP server (Streamable HTTP). The MCP endpoint is{' '}
        <code>/api/mcp</code> and requires an <code>Authorization</code> header.
      </p>
      <p>
        Forked from{' '}
        <a href="https://github.com/helbertparanhos/vercel-mcp-pro">vercel-mcp-pro</a> (MIT).
      </p>
    </main>
  );
}
