const data = {
  url: "https://nextjs.org/docs",
  title: "Routing Concepts",
  version: "15.1.0",
  codeBlocks: ["import { useRouter } from 'next/navigation'"],
  breakingChanges: [{ heading: "useRouter change", content: "initialProps deprecated" }],
  rawHtmlSnippet: "<main><h1>Routing Concepts</h1><pre><code>import { useRouter } from 'next/navigation'</code></pre></main>"
};

fetch('http://localhost:3000/api/ingest', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
