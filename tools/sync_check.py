# tools/sync_check.py
import re

with open('frontend/index.html', encoding='utf-8') as f:
    text = f.read()

hrefs = set(re.findall(r'href=["\'](.*?)["\']', text))
srcs = set(re.findall(r'src=["\'](.*?)["\']', text))

print('HREFS:')
for h in sorted(hrefs):
    print(' ', h)

print('\nSRCS:')
for s in sorted(srcs):
    print(' ', s)
