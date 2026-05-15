const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = [
  { regex: /bg-(emerald|cyan|indigo|violet|fuchsia|rose|blue)-500\/([0-9]+)/g, replace: 'bg-white/$2' },
  { regex: /bg-(emerald|cyan|indigo|violet|fuchsia|rose|blue)-400\/([0-9]+)/g, replace: 'bg-white/$2' },
  { regex: /bg-(emerald|cyan|indigo|violet|fuchsia|rose|blue)-500/g, replace: 'bg-zinc-800' },
  { regex: /bg-(emerald|cyan|indigo|violet|fuchsia|rose|blue)-400/g, replace: 'bg-zinc-700' },
  
  { regex: /text-(emerald|cyan|indigo|violet|fuchsia|rose|blue)-500\/([0-9]+)/g, replace: 'text-white/$2' },
  { regex: /text-(emerald|cyan|indigo|violet|fuchsia|rose|blue)-400\/([0-9]+)/g, replace: 'text-white/$2' },
  { regex: /text-(emerald|cyan|indigo|violet|fuchsia|rose|blue)-500/g, replace: 'text-zinc-400' },
  { regex: /text-(emerald|cyan|indigo|violet|fuchsia|rose|blue)-400/g, replace: 'text-zinc-300' },
  
  { regex: /border-(emerald|cyan|indigo|violet|fuchsia|rose|blue)-500\/([0-9]+)/g, replace: 'border-white/$2' },
  { regex: /border-(emerald|cyan|indigo|violet|fuchsia|rose|blue)-400\/([0-9]+)/g, replace: 'border-white/$2' },
  { regex: /border-(emerald|cyan|indigo|violet|fuchsia|rose|blue)-500/g, replace: 'border-zinc-700' },
  { regex: /border-(emerald|cyan|indigo|violet|fuchsia|rose|blue)-400/g, replace: 'border-zinc-600' },
  
  { regex: /ring-(emerald|cyan|indigo|violet|fuchsia|rose|blue)-500\/([0-9]+)/g, replace: 'ring-white/$2' },
  
  { regex: /from-(emerald|cyan|indigo|violet|fuchsia|rose|blue)-500/g, replace: 'from-zinc-800' },
  { regex: /to-(emerald|cyan|indigo|violet|fuchsia|rose|blue)-500/g, replace: 'to-zinc-900' },
  
  { regex: /selection:bg-(emerald|cyan|indigo|violet|fuchsia|rose|blue)-500\/([0-9]+)/g, replace: 'selection:bg-white/$2' }
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(directoryPath);
let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  replacements.forEach(({ regex, replace }) => {
    content = content.replace(regex, replace);
  });
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
    console.log(`Updated ${file}`);
  }
});

console.log(`\nFinished! Modified ${modifiedCount} files.`);
