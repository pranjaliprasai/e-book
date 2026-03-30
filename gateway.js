import http from 'http';
import httpProxy from 'http-proxy';

const proxy = httpProxy.createProxyServer({});

// Error handling to prevent crashes
proxy.on('error', (err, req, res) => {
  console.error('[Proxy Error]:', err.message);
  res.writeHead(502, { 'Content-Type': 'text/plain' });
  res.end('Gateway Error: Is the target server (Backend or Metro) running?');
});

const server = http.createServer((req, res) => {
  console.log(`[Request]: ${req.method} ${req.url}`);

  if (req.url.startsWith('/api') || req.url.startsWith('/uploads')) {
    // Route to Backend (5000)
    proxy.web(req, res, { target: 'http://localhost:5000' });
  } else {
    // Route to Metro (8081)
    proxy.web(req, res, { 
      target: 'http://localhost:8081',
      ws: true // Enable WebSockets for Metro HMR
    });
  }
});

// Support WebSocket proxying for Metro
server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head, { target: 'http://localhost:8081' });
});

server.listen(9999, () => {
  console.log('--- UNIFIED GATEWAY READY ---');
  console.log('Listening on port 9999');
  console.log('Routing:');
  console.log('  /api/*     -> http://localhost:5000');
  console.log('  /uploads/* -> http://localhost:5000');
  console.log('  /*         -> http://localhost:8081');
});
