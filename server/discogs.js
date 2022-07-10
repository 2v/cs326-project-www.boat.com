import 'dotenv/config';

const discogsURL = "https://api.discogs.com/";
const DISCOGS_CONSUMER_KEY = process.env.DISCOGS_CONSUMER_KEY;
const DISCOGS_CONSUMER_SECRET = process.env.DISCOGS_CONSUMER_SECRET;

export async function generateAlbums(styles, albumCount) {
  let albums = []; // albums will be a list containing objects with thumbnail image and link to discogs page

  // search this and last year to avoid querying too much
  const date = new Date();
  let yearsToSearch = [date.getFullYear(), date.getFullYear() - 1];

  for (const year of yearsToSearch) {
    for (const style of styles) {
      console.log(`${discogsURL}database/search?type=master&style=${style}&year=${year}&key=${DISCOGS_CONSUMER_KEY}&secret=${DISCOGS_CONSUMER_SECRET}`)
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

      albums.push((await response.json()).results.map(x => { return {"url": `https://discogs.com${x.uri}`, "thumbnail": x.thumb}}))
    }
    console.log(albums);

  }
}

generateAlbums(['Hip Hop'], []);

// TODO: possibly use database to store a users suggestions and allow them to view past album recommendations
//      we could use Passport for this, users who are logged in will be able to access their past set of recommended albums

