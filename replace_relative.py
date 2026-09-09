import os, glob, re

files = glob.glob('frontend/src/pages/*.tsx')
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Replace fetch(`${import.meta.env.VITE_API_URL}/api...`) with fetch(`/api...`)
    content = re.sub(r"`\$\{import\.meta\.env\.VITE_API_URL\}(/api.*?)`", r"`\1`", content)
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
