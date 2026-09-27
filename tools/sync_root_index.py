# tools/sync_root_index.py
import re

with open('frontend/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace css links
content = content.replace('href="./css/', 'href="./frontend/css/')
# Replace js entrypoint
content = content.replace('src="./js/app.js"', 'src="./frontend/js/app.js"')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Successfully synced frontend/index.html -> root index.html')
