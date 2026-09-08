import os, glob, re

files = glob.glob('frontend/src/pages/*.tsx')
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # It currently looks like: fetch(`${import.meta.env.VITE_API_URL}/api/fleet')
    # Or fetch(`${import.meta.env.VITE_API_URL}/api/fleet/vehicles', {
    # Let's use regex to find: `\${import.meta.env.VITE_API_URL}(.*?)'
    # And replace with: `\${import.meta.env.VITE_API_URL}\1`
    
    content = re.sub(r"`\$\{import\.meta\.env\.VITE_API_URL\}(.*?)'", r"`${import.meta.env.VITE_API_URL}\1`", content)
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
