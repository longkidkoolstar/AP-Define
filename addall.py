import json

manifest_path = 'C:\\Users\\babyk\\OneDrive\\Documents\\GitHub\\AP-Define\\manifest.json'

try:
    with open(manifest_path, 'r') as file:
        manifest_data = json.load(file)
    icons = [icon['src'] for icon in manifest_data.get('icons', [])]
except (FileNotFoundError, json.JSONDecodeError) as e:
    print(f"Error: {e}")
    icons = []

sw_js_content = """
self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open('ap-define-cache').then((cache) => {
        return cache.addAll([
          '/',
          '/index.html',
          '/styles.css',
          '/index.js',
          '/manifest.json',
"""
for icon in icons:
    sw_js_content += f"          '{icon}',\n"

sw_js_content += """
        ]);
      })
    );
  });

self.addEventListener('fetch', (event) => {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
});
"""

try:
    with open('sw.js', 'w') as sw_file:
        sw_file.write(sw_js_content)
    print("sw.js created successfully.")
except Exception as e:
    print(f"Error writing sw.js: {e}")
