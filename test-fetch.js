async function main() {
  const targetUrl = "https://www.designi.com.br/1d53301fc233861b";
  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      }
    });
    console.log("Status:", response.status);
    console.log("Final URL:", response.url);
    const html = await response.text();
    console.log("HTML length:", html.length);
    console.log("Includes 'Pastelaria':", html.includes("Pastelaria"));
    console.log("Includes '13772690':", html.includes("13772690"));
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    console.log("Title:", titleMatch ? titleMatch[1] : "None");
  } catch (err) {
    console.error(err);
  }
}
main();
