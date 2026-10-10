import { GAME_CATALOG } from "./gameCatalog";
import { EXPECTED_GAME_COUNT } from "./gameTypes";
import { assertExactCatalogCount } from "./gameCatalog";

assertExactCatalogCount();

const titles = GAME_CATALOG.map((game) => game.title);
const duplicateTitles = titles.filter((title, index) => titles.indexOf(title) !== index);

console.log(`MAXIM RETRO catalogue verification`);
console.log(`EXPECTED_GAME_COUNT = ${EXPECTED_GAME_COUNT}`);
console.log(`FOUND = ${GAME_CATALOG.length}`);
console.log(`UNIQUE IDS = ${new Set(GAME_CATALOG.map((game) => game.id)).size}`);
if (duplicateTitles.length > 0) {
  console.log(`Duplicate titles kept as separate records: ${[...new Set(duplicateTitles)].join(", ")}`);
  for (const title of new Set(duplicateTitles)) {
    const matches = GAME_CATALOG.filter((game) => game.title === title);
    for (const match of matches) {
      console.log(`  ${match.id}  ${match.platform}  ${match.year}`);
    }
  }
}

if (GAME_CATALOG.length !== EXPECTED_GAME_COUNT) {
  throw new Error(`EXPECTED_GAME_COUNT ${EXPECTED_GAME_COUNT} but found ${GAME_CATALOG.length}`);
}
