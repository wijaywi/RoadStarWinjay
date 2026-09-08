import os, glob

files = glob.glob('frontend/src/pages/*.tsx')
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Replace 'http://localhost:3001/api...' with `${import.meta.env.VITE_API_URL}/api...`
    content = content.replace("'http://localhost:3001", "`\\${import.meta.env.VITE_API_URL}")
    # Fix the double escape
    content = content.replace("`\\${", "`${")
    content = content.replace("http://localhost:3001", "${import.meta.env.VITE_API_URL}")
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
