"""Local full-system preview with the existing portal authentication service."""
import mimetypes
import argparse
import json
import sys
import threading
import webbrowser
from http.client import HTTPConnection
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
AUTH_PROJECT = ROOT.parent / 'ChatGPT' / 'Final_Project_G1'
sys.path.insert(0, str(AUTH_PROJECT))
from backend import server as auth_backend

# Cookies are shared across ports on one host; isolate this system's session.
auth_backend.COOKIE = 'nuf_verified_session'


class FullSystemHandler(auth_backend.PortalHandler):
    def do_GET(self):
        path = unquote(urlsplit(self.path).path)
        if path == '/api/health':
            if not self.valid_host():
                return self.reply(403, {'error': 'Use the local portal address.'})
            return self.reply(200, {'service': 'NU_G1_FINAL-auth', 'version': 2})
        if path.startswith('/api/'):
            return super().do_GET()
        if not self.valid_host():
            return self.reply(403, {'error': 'Use the local portal address.'})
        relative = 'index.html' if path == '/' else path.lstrip('/')
        file = (ROOT / relative).resolve()
        permitted = relative == 'index.html' or (
            relative.startswith(('js/', 'css/', 'assets/'))
            and file.suffix.lower() in {'.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.woff2', '.woff', '.webp'}
        )
        if not file.is_relative_to(ROOT) or not permitted or not file.is_file():
            return self.reply(404, {'error': 'Not found.'})
        body = file.read_bytes()
        self.send_response(200)
        self.send_header('Content-Type', mimetypes.guess_type(file)[0] or 'application/octet-stream')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        self.wfile.write(body)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--open-browser', action='store_true')
    args = parser.parse_args()
    connection = HTTPConnection('127.0.0.1', 4175, timeout=2)
    ready = False
    try:
        connection.request('GET', '/api/health')
        response = connection.getresponse()
        ready = response.status == 200 and json.loads(response.read()).get('service') == 'NU_G1_FINAL-auth'
    except (OSError, ValueError):
        pass
    finally:
        connection.close()
    if ready:
        print('NU_G1_FINAL authentication service is already running.', flush=True)
        if args.open_browser:
            webbrowser.open('http://127.0.0.1:4175/#/login')
        parser.exit()
    auth = auth_backend.PortalAuth(Path.home() / '.nu-facility-support-local')
    try:
        server = auth_backend.PortalServer(('127.0.0.1', 4175), auth)
    except OSError:
        parser.exit(1, 'Port 4175 is occupied by another server. Stop that preview, then launch Open-Portal.cmd again.\n')
    server.RequestHandlerClass = FullSystemHandler
    ipv6_server = None
    try:
        ipv6_server = auth_backend.IPv6PortalServer(('::1', 4175), auth)
        ipv6_server.RequestHandlerClass = FullSystemHandler
        threading.Thread(target=ipv6_server.serve_forever, daemon=True).start()
    except OSError:
        pass
    print('NU_G1_FINAL: http://127.0.0.1:4175/#/login', flush=True)
    if args.open_browser:
        webbrowser.open('http://127.0.0.1:4175/#/login')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        if ipv6_server:
            ipv6_server.shutdown()
            ipv6_server.server_close()
