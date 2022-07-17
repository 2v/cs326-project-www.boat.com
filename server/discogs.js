import 'dotenv/config';
import {shuffle} from "./utils.js";

const discogsURL = "https://api.discogs.com/";
const DISCOGS_CONSUMER_KEY = process.env.DISCOGS_CONSUMER_KEY;
const DISCOGS_CONSUMER_SECRET = process.env.DISCOGS_CONSUMER_SECRET;

// use a minimumHave count to ensure that we are only suggesting relevant albums. Some albums with barely any haves
// are usually releases which are not relevant to most users, however we do want to ensure that we are finding music
// from smaller independent artists so this should be small
export async function generateAlbums(styles, albumCount, minimumHave, ) {
  let albums = []; // albums will be a list containing objects with thumbnail image and link to discogs page

  // search this and last year to avoid querying too much
  const date = new Date();
  let yearsToSearch = [date.getFullYear(), date.getFullYear() - 1];

  for (const year of yearsToSearch) {
    for (const style of styles) {
      // console.log(`${discogsURL}database/search?type=master&style=${style}&year=${year}&key=${DISCOGS_CONSUMER_KEY}&secret=${DISCOGS_CONSUMER_SECRET}`)
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
        console.log("response not ok");
        return -1;
      }

      let responseJSON = await response.json();

      albums = albums.concat(responseJSON.results.filter(x => x.community.have > minimumHave && x.thumb !== "")
        .map(x => { return {"url": `https://discogs.com${x.uri}`, "thumbnail": x.thumb}}))
    }
  }

  return shuffle(albums).slice(0, albumCount);
}

