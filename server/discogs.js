import 'dotenv/config';

const discogsURL = "https://api.discogs.com/";

// async function getStars() {
//   let response = await fetch(githubURL + document.getElementById('repo').value);
//   if (response.ok) {
//     let responseJSON = await response.json();
//     document.getElementById('star_count').innerText = responseJSON['stargazers_count'];
//   } else {
//     alert("an error has occurred!");
//   }
// }
//
// function initialize() {
//   document.getElementById('count_stars').addEventListener('click', getStars);
// }
//
// initialize();


export async function getAlbums(genres) {
  // TODO: use .env file to store Discogs API key and secret and add this file to gitignore
  console.log("test");

  // testing use of environment variables
  console.log(process.env.DISCOGS_CONSUMER_KEY);



  // TODO: make fetch request for JSON response
  // TODO: sort response by release year, and slice the top 200 or so
  // TODO: select random albums from this set and return

}


// TODO: possibly use database to store a users suggestions and allow them to view past album recommendations
//      we could use Passport for this, users who are logged in will be able to access their past set of recommended albums

