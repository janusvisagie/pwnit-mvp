import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src', 'app', 'item', '[id]', 'page.tsx');
let source = fs.readFileSync(filePath, 'utf8');

const replacements = [
  {
    from: 'className="mx-auto h-44 w-full object-contain sm:h-52"',
    to: 'className="mx-auto h-60 w-full object-contain sm:h-72 lg:h-[28rem]"',
  },
  {
    from: 'className="mx-auto h-44 w-full object-contain sm:h-52"',
    to: 'className="mx-auto h-60 w-full object-contain sm:h-72 lg:h-[28rem]"',
  },
];

let changed = false;
for (const replacement of replacements) {
  if (source.includes(replacement.from)) {
    source = source.replace(replacement.from, replacement.to);
    changed = true;
  }
}

if (!changed) {
  source = source.replace(/className="mx-auto h-\d+ w-full object-contain(?: sm:h-\d+)?"/, 'className="mx-auto h-60 w-full object-contain sm:h-72 lg:h-[28rem]"');
}

fs.writeFileSync(filePath, source, 'utf8');
console.log(`Updated ${filePath}`);
