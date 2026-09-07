const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT) || 3000;
const mimeTypes = {
    '.bat': 'text/plain; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.svg': 'image/svg+xml',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

function send(response, status, body, type) {
    response.writeHead(status, { 'Content-Type': type || 'text/plain; charset=utf-8' });
    response.end(body);
}

const server = http.createServer((request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        send(response, 405, 'Method Not Allowed');
        return;
    }

    const requestPath = decodeURIComponent((request.url || '/').split('?')[0]);
    const relativePath = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
    const filePath = path.resolve(root, relativePath);

    if (filePath !== root && !filePath.startsWith(root + path.sep)) {
        send(response, 403, 'Forbidden');
        return;
    }

    fs.stat(filePath, (error, stats) => {
        if (error || !stats.isFile()) {
            if (error || !stats.isDirectory()) {
                send(response, 404, 'Not Found');
                return;
            }

            const indexPath = path.join(filePath, 'index.html');
            fs.stat(indexPath, (indexError, indexStats) => {
                if (indexError || !indexStats.isFile()) {
                    send(response, 404, 'Not Found');
                    return;
                }
                serveFile(indexPath, request, response);
            });
            return;
        }

        serveFile(filePath, request, response);
    });
});

function serveFile(filePath, request, response) {
        const contentType = mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
        response.writeHead(200, { 'Content-Type': contentType });
        if (request.method === 'HEAD') {
            response.end();
            return;
        }
        fs.createReadStream(filePath).pipe(response);
}

server.listen(port, () => {
    console.log(`The Last Riders disponible en http://localhost:${port}`);
});

server.on('error', error => {
    if (error.code === 'EADDRINUSE') {
        console.error(`El puerto ${port} ya esta en uso. Cierra el otro servidor o usa PORT=3001.`);
    } else {
        console.error(error.message);
    }
    process.exitCode = 1;
});