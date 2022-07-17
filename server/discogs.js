import 'dotenv/config';
import {shuffle} from "./utils.js";
import fetch from 'node-fetch';

const discogsURL = "https://api.discogs.com/";
const DISCOGS_CONSUMER_KEY = process.env.DISCOGS_CONSUMER_KEY;
const DISCOGS_CONSUMER_SECRET = process.env.DISCOGS_CONSUMER_SECRET;


/**
 * Perform a search of the Discogs database for the specified styles. All search results are from the current and
 * past year. These are then compiled and then shuffled and sliced to return the correct album count.
 *
 * We use a minimumHave count to ensure that we are only suggesting relevant albums. The have metric is used on discogs
 * to track how many users own a certain album, so it is a good measure of relevance. Albums with few haves
 * are releases which are not relevant to most users, however we do want to ensure that we are finding music
 * from smaller independent artists so this should value should still be small.
 *
 * @param {string[]} styles
 * @param {int} albumCount
 * @param {int} minimumHave
 */
export async function generateAlbums(styles, albumCount, minimumHave, ) {
  let albums = []; // albums will be a list containing objects with thumbnail image and link to discogs page

  // search this and last year to avoid querying too much
  const date = new Date();
  let yearsToSearch = [date.getFullYear(), date.getFullYear() - 1];

  for (const year of yearsToSearch) {
    for (const style of styles) {
      let response = await fetch(
        `${discogsURL}database/search?type=master&style=${style}&year=${year}&key=${DISCOGS_CONSUMER_KEY}&secret=${DISCOGS_CONSUMER_SECRET}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        return -1;
      }

      let responseJSON = await response.json();

      albums = albums.concat(responseJSON.results.filter(x => x.community.have > minimumHave && x.thumb !== "")
        .map(x => { return {"url": `https://discogs.com${x.uri}`, "thumbnail": x.thumb}}))
    }
  }

  return shuffle(albums).slice(0, albumCount);
}

