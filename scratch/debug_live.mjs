async function main() {
  try {
    const res = await fetch('https://rkalani1.github.io/stroke/app.js?cb=' + Date.now());
    const text = await res.text();
    const index = text.indexOf('dissection_stroke_mechanisms.png');
    if (index !== -1) {
      console.log('Found dissection_stroke_mechanisms.png at index:', index);
      console.log('Snippet:', text.substring(index - 600, index + 150));
    } else {
      console.log('dissection_stroke_mechanisms.png not found in app.js!');
    }
  } catch (err) {
    console.error(err);
  }
}

main();
