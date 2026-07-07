import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Change activeTab default to 'chat'
content = re.sub(
    r"const \[activeTab, setActiveTab\] = useState<[^>]+>\('[^']+'\);",
    "const [activeTab, setActiveTab] = useState<'mentions' | 'chat' | 'report'>('chat');",
    content
)

# 2. Remove sidebar buttons
content = re.sub(
    r'<button\s+id="tab-overview-btn".*?</button>\s*',
    '',
    content,
    flags=re.DOTALL
)

content = re.sub(
    r'<button\s+id="tab-competitors-btn".*?</button>\s*',
    '',
    content,
    flags=re.DOTALL
)

content = re.sub(
    r'<button\s+id="tab-risks-btn".*?</button>\s*',
    '',
    content,
    flags=re.DOTALL
)

content = re.sub(
    r'<button\s+id="tab-programs-btn".*?</button>\s*',
    '',
    content,
    flags=re.DOTALL
)

# 3. Remove main content sections using a helper function to balance braces
def remove_block(content, prefix):
    start_idx = content.find(prefix)
    if start_idx == -1:
        return content
    
    # find the opening parenthesis after the prefix
    paren_start = content.find('(', start_idx)
    if paren_start == -1:
        return content
    
    # find the matching closing parenthesis
    count = 1
    i = paren_start + 1
    while count > 0 and i < len(content):
        if content[i] == '(': count += 1
        elif content[i] == ')': count -= 1
        i += 1
        
    # include the `}` after `)`
    end_idx = content.find('}', i) + 1
    return content[:start_idx] + content[end_idx:]

content = remove_block(content, "{activeTab === 'overview' && (")
content = remove_block(content, "{activeTab === 'competitors' && (")
content = remove_block(content, "{activeTab === 'risks' && (")
content = remove_block(content, "{activeTab === 'programs' && (")

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("App.tsx modified successfully")
