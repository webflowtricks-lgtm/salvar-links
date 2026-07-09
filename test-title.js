async function test() {
  const code = 'C8R5_T3N7Sg';
  const url = `https://www.instagram.com/p/${code}/embed/`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    
    // Look for blockquotes or paragraphs
    const blockquotes = html.match(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/i);
    if (blockquotes) {
      console.log('Blockquote found:', blockquotes[1].substring(0, 500));
    } else {
      console.log('No blockquote found');
    }

    const paragraphs = html.match(/<p[^>]*>([\s\S]*?)<\/p>/g);
    if (paragraphs) {
      console.log('Total paragraphs found:', paragraphs.length);
      paragraphs.slice(0, 5).forEach((p, i) => {
        console.log(`Paragraph ${i}:`, p.substring(0, 200));
      });
    } else {
      console.log('No paragraphs found');
    }

    // Look for any div/span/a that might contain text of the caption
    // Let's look for "Caption" in JSON or anything
    const idxCaption = html.indexOf('caption');
    if (idxCaption !== -1) {
      console.log('Around caption:', html.substring(idxCaption - 50, idxCaption + 150));
    }

  } catch (err) {
    console.error(err);
  }
}
test();
