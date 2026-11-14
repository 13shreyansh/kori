#!/bin/sh
# Package the built app as a claude.ai Artifact: page body + assets + demo customers only.
set -e
cd "$(dirname "$0")/.."
OUT=../artifact; rm -rf $OUT; mkdir -p $OUT/data/customers
cp -r dist/assets $OUT/
python3 - <<'PY'
import re
h=open('dist/index.html').read()
head=re.search(r'<head>(.*)</head>',h,re.S).group(1)
body=re.search(r'<body>(.*)</body>',h,re.S).group(1)
keep=''.join(re.findall(r'<script[^>]*></script>|<link rel="stylesheet"[^>]*>',head))
open('../artifact/index.html','w').write('<title>Kori money coach</title>\n'+keep+'\n'+body)
PY
cp public/data/demo.json $OUT/data/
for id in $(python3 -c "import json;print(' '.join(p['id'] for p in json.load(open('public/data/demo.json'))))"); do cp public/data/customers/$id.json $OUT/data/customers/; done
ls -R $OUT | head -30; du -sh $OUT
