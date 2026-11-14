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
cp public/data/demo.json public/data/persona_map.json $OUT/data/
cp public/favicon.svg $OUT/
# demo customers plus every example customer the persona map can open
for id in $(python3 -c "
import json
ids={p['id'] for p in json.load(open('public/data/demo.json'))}
for c in json.load(open('public/data/persona_map.json'))['cells'].values():
    for e in [c['example'],*c['byTrait'].values()]:
        if e: ids.add(e['id'])
print(' '.join(sorted(ids)))"); do cp public/data/customers/$id.json $OUT/data/customers/; done
ls -R $OUT | head -30; du -sh $OUT
