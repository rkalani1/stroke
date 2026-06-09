async function main() {
  try {
    const url = 'https://rkalani1.github.io/stroke/documents/references/Cervical%20Artery%20Dissection.pdf';
    console.log('Fetching live PDF:', url);
    const res = await fetch(url);
    console.log('  Status:', res.status);
    console.log('  Content-Length:', res.headers.get('content-length'));
    console.log('  Content-Type:', res.headers.get('content-type'));
  } catch (err) {
    console.error(err);
  }
}

main();
