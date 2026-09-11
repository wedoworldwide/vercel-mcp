import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
const s = new McpServer({ name:'t', version:'1' }, { capabilities:{ tools:{} } });
console.log('has .server:', !!s.server);
console.log('server ctor:', s.server?.constructor?.name);
try { s.server.registerCapabilities({tools:{}}); console.log('registerCapabilities OK'); }
catch(e){ console.log('registerCapabilities THREW:', e.message); }
try { const { ListToolsRequestSchema } = await import('@modelcontextprotocol/sdk/types.js');
  s.server.setRequestHandler(ListToolsRequestSchema, async()=>({tools:[]}));
  console.log('setRequestHandler OK'); } catch(e){ console.log('setRequestHandler THREW:', e.message); }
