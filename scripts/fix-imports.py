#!/usr/bin/env python3
"""Replace local BASE_URL const with SITE_URL import from site-config in all matching files."""
import re, os, glob

files = []
for ext in ('*.ts', '*.tsx'):
    files.extend(glob.glob(f'src/**/{ext}', recursive=True))

for fpath in sorted(files):
    with open(fpath, 'r') as f:
        content = f.read()
    
    # Skip files that already import from site-config or don't have BASE_URL
    if 'site-config' in content:
        continue
    if 'const BASE_URL' not in content:
        continue
    if 'BASE_URL' not in content:
        continue
    
    original = content
    
    # Remove the BASE_URL const declaration (handles multi-line)
    content = re.sub(
        r'const BASE_URL\s*=\s*process\.env\.NEXT_PUBLIC_BASE_URL\s*\|\|\s*"[^"]+";?\s*\n?',
        '', content
    )
    
    # Replace all remaining BASE_URL references with SITE_URL
    content = content.replace('BASE_URL', 'SITE_URL')
    
    # Add import at top — find the last import line and insert after it
    lines = content.split('\n')
    last_import_idx = -1
    for i, line in enumerate(lines):
        if line.startswith('import '):
            last_import_idx = i
    
    if last_import_idx >= 0:
        lines.insert(last_import_idx + 1, 'import { SITE_URL } from "@/lib/site-config";')
        content = '\n'.join(lines)
    
    if content != original:
        with open(fpath, 'w') as f:
            f.write(content)
        print(f'Updated: {fpath}')

print('Done!')
