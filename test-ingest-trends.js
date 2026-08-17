const data = [
  {
    repoName: "microsoft/TypeScript",
    description: "TypeScript is a superset of JavaScript that compiles to clean JavaScript output.",
    language: "TypeScript",
    stars: 92451
  },
  {
    repoName: "facebook/react",
    description: "A declarative, efficient, and flexible JavaScript library for building user interfaces.",
    language: "JavaScript",
    stars: 209000
  }
];

fetch('http://localhost:3000/api/ingest?type=trend', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
