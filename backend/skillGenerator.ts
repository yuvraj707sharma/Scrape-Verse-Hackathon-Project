import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { saveGeneratedSkill } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILLS_DIR = path.join(__dirname, '../skills/generated');

if (!fs.existsSync(SKILLS_DIR)) {
  fs.mkdirSync(SKILLS_DIR, { recursive: true });
}

export function generateAgentSkill(docData: any) {
  // Extract a library name from the title or URL (simplified)
  let libraryName = docData.title.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'unknown-lib';
  const version = docData.version || 'latest';
  const currentDate = new Date().toISOString().split('T')[0];

  const breakingChangesText = (docData.breakingChanges || [])
    .map((b: any) => `### ${b.heading}\n${b.content}`)
    .join('\n\n');

  const codeBlocksText = (docData.codeBlocks || [])
    .map((code: string) => `\`\`\`typescript\n${code}\n\`\`\``)
    .join('\n\n');

  const markdownContent = `---
name: ${libraryName}-v${version}
description: Live documentation updates, breaking API changes, and code patterns for ${libraryName}
version: ${version}
updated_at: ${currentDate}
---

# ${libraryName} API Knowledge & Rules

## Breaking Changes & Deprecations
${breakingChangesText || 'No breaking changes reported.'}

## Recommended Code Patterns
${codeBlocksText || 'No code snippets available.'}
`;

  const filePath = path.join(SKILLS_DIR, `${libraryName}.md`);
  fs.writeFileSync(filePath, markdownContent);

  const skillData = {
    library_name: libraryName,
    version,
    markdown_content: markdownContent
  };
  
  saveGeneratedSkill(skillData);
  return skillData;
}
