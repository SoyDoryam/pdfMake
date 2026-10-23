var http = require('http');
var fs = require('fs');
var path = require('path');
var childProcess = require('child_process');

var rootDir = path.join(__dirname, '..');
var publicDir = path.join(__dirname, 'public');
var vendorDir = path.join(publicDir, 'vendor');

var mimeTypes = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.map': 'application/json; charset=utf-8',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.svg': 'image/svg+xml',
	'.ttf': 'font/ttf'
};

function ensureVendorFiles() {
	var bundle = path.join(vendorDir, 'pdfmake.min.js');
	var fonts = path.join(vendorDir, 'Roboto.js');

	if (fs.existsSync(bundle) && fs.existsSync(fonts)) {
		return;
	}

	console.log('Building pdfmake browser bundle for the playground...');
	childProcess.execSync('npx webpack && npx shx mkdir -p build/fonts/Roboto && npx shx cp -r fonts/Roboto/*.* build/fonts/Roboto && npx brfs "./src/browser-extensions/fonts/Roboto.js" > build/fonts/Roboto.js', {
		cwd: rootDir,
		stdio: 'inherit'
	});

	fs.mkdirSync(vendorDir, { recursive: true });
	fs.copyFileSync(path.join(rootDir, 'build', 'pdfmake.min.js'), bundle);
	fs.copyFileSync(path.join(rootDir, 'build', 'fonts', 'Roboto.js'), fonts);
}

ensureVendorFiles();

var server = http.createServer(function (req, res) {
	var pathname = decodeURIComponent(req.url.split('?')[0]);
	if (pathname === '/') {
		pathname = '/index.html';
	}

	var filePath = path.join(publicDir, path.normalize(pathname));
	if (filePath.indexOf(publicDir) !== 0) {
		res.writeHead(403);
		res.end('Forbidden');
		return;
	}

	fs.readFile(filePath, function (err, data) {
		if (err) {
			res.writeHead(404);
			res.end('Not found');
			return;
		}

		res.writeHead(200, {
			'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream',
			'Cache-Control': 'no-store'
		});
		res.end(data);
	});
});

var port = process.env.PORT || 3000;
server.listen(port, '0.0.0.0', function () {
	console.log('dev-playground is available at http://localhost:%d', port);
});
