import fs from "fs";

function main() {
  const js = fs.readFileSync("designi-main.js", "utf8");
  
  // Search for getDesignDetailData or the function definition
  const terms = ["getDesignDetailData", "getDesignById"];
  for (const t of terms) {
    let idx = -1;
    let count = 0;
    while ((idx = js.indexOf(t, idx + 1)) !== -1) {
      count++;
      if (count <= 10) {
        console.log(`Term "${t}" found at ${idx}:`);
        console.log(js.substring(idx - 100, idx + 300));
        console.log("-------------------");
      }
    }
  }
}
main();
