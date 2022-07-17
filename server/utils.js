// Fisher-Yates shuffle (https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle)
// -- To shuffle an array a of n elements (indices 0..n-1):
// for i from n−1 downto 1 do
//   j ← random integer such that 0 ≤ j ≤ i
// exchange a[j] and a[i]

import Fuse from "fuse.js";

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i+1))
    let temp = array[j];
    array[j] = array[i];
    array[i] = temp;
  }
  return array;
}

/**
 * Parse the JSON response from Spotify and use it to find matching styles in the Discogs style database.
 *
 * @param {JSON} response the JSON response from Spotify when requesting a user's top artists
 * @param {int} styleCount the amount of styles we want returned from the fuzzy search
 * @param {int} styles the list of Discogs styles we are searching by Spotify styles
 */
function parseStylesFromTopArtists(response, styleCount, styles) {
  // use fuse to perform a fuzzy search of the styles database
  const fuse = new Fuse(styles, { includeScore: true })

  // search each genre for each artist using fuse and concatenate them together
  let styleSearchResults = response.items.reduce((acc, e) => acc.concat(
    e.genres.reduce((acc, e) => acc.concat(fuse.search(e)), [])), [])

  // console.log(styleSearchResults);

  // sort the search results to get the best matches
  let bestMatches = styleSearchResults.sort((a, b) => a.score - b.score);

  // use the sorted results to create a set of styles with size styleCount
  let styleSet = new Set([]);
  let i = 0;
  while ((styleSet.size < styleCount) && (i < bestMatches.length)) {
    styleSet.add(bestMatches[i].item);
    i++;
  }

  return Array.from(styleSet);
}

export { shuffle, parseStylesFromTopArtists}
