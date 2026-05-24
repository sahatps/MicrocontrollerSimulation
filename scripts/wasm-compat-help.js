console.log([
  'WASM compatibility corpus runs in the browser because it uses Web Workers, Cache API, and wasm-clang assets.',
  '',
  'Run it with:',
  '  npm run dev',
  '  open http://localhost:3000/hackcable/index.html?wasm-compat=1',
  '',
  'Results are printed in the browser console as [wasm-compat] logs and a console.table summary.',
  'You can also run window.hackCableRunWasmCompat() manually from DevTools.',
].join('\n'));
