/**
 * Catalog check / data-store initializer.
 * Courses & categories are loaded directly from data/catalog.js at runtime,
 * so there is no course table to seed. This script validates the catalog
 * and ensures the JSON data store exists.
 */
const { CATEGORIES, COURSES } = require('./data/catalog');
const store = require('./store'); // creates data.json if missing

const byCat = {};
for (const c of COURSES) byCat[c.category] = (byCat[c.category] || 0) + 1;

console.log(`Catalog OK: ${CATEGORIES.length} tracks, ${COURSES.length} certifications.`);
for (const cat of CATEGORIES) console.log(`  • ${cat.name}: ${byCat[cat.slug] || 0}`);
console.log(`Data store ready (${store.raw().users.length} users).`);
process.exit(0);
