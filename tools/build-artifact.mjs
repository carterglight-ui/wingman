// Builds dist/wingman.html: one self-contained page for publishing as a
// private claude.ai link. That version runs on the viewer's Claude account,
// so the API-key SDK is swapped for a stub to keep the file small.
//   npm install && npm run build:artifact
import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const stubSdk = {
  name: 'stub-sdk',
  setup(b) {
    b.onResolve({ filter: /vendor\/anthropic\.js$/ }, () => ({ path: 'stub', namespace: 'stub' }));
    b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
      contents: 'export default class Anthropic { constructor() { throw new Error("Open Wingman through its Claude link."); } }',
    }));
  },
};

const js = await build({
  entryPoints: ['js/app.js'], bundle: true, format: 'iife', minify: true, write: false, plugins: [stubSdk],
});
const css = (await readFile('css/app.css', 'utf8'))
  + '\n:root { --pad-t: 0px; --pad-b: 0px; }\nhtml, body { min-height: 100%; }\n';
let shell = await readFile('index.html', 'utf8');
const body = shell.slice(shell.indexOf('<body>') + 6, shell.indexOf('<script type="module"'));

const html = `<title>Wingman</title>
<style>
${css}
</style>
${body.trim()}
<script>
${js.outputFiles[0].text.replaceAll('</script', '<\\/script')}
</script>
`;
await mkdir('dist', { recursive: true });
await writeFile('dist/wingman.html', html);
console.log(`dist/wingman.html ${(html.length / 1024).toFixed(0)} KB`);
