import fs from "fs";

function main() {
  const js = fs.readFileSync("designi-main.js", "utf8");
  const idx = js.indexOf("getDesignById");
  // Let's print the previous 4000 characters from the index of getDesignById
  console.log(js.substring(idx - 3000, idx));
}
main();
