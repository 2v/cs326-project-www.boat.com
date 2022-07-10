import express from 'express';
import logger from 'morgan';
import session from 'express-session';
import passport from 'passport';
import passportSpotify from 'passport-spotify';
import Fuse from 'fuse.js';
import { styles } from './styles.js'
import {database} from "./database.js";   // for when we use a database for serialization / deserialization

import epgSession from 'express-pg-session';
const pgSession = epgSession(session);


const SpotifyStrategy = passportSpotify.Strategy;

const authCallbackPath = '/auth/spotify/callback';

const port = process.env.PORT || 8888;


// example code from: https://github.com/JMPerez/passport-spotify
// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session. Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing. However, since this example does not
//   have a database of user records, the complete spotify profile is serialized
//   and deserialized.
passport.serializeUser(function (user, callback) {
  callback(null, user);
});

passport.deserializeUser(function (user, callback) {
  callback(null, user);
});


// Use the SpotifyStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, expires_in
//   and spotify profile), and invoke a callback with a user object.
passport.use(
  new SpotifyStrategy(
    {
      clientID: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      callbackURL: 'http://localhost:' + port + authCallbackPath,
    },
    async function (accessToken, refreshToken, expires_in, profile, done) {

      // TODO: get a user's top 3 genres and add them to the database if they don't already exist
      //  we will set up the database to be indexed by user ID

      // TODO: add user's name to the database, this way we no longer have to interface with Spotify object
      console.log(accessToken);

      // a test of using the spotify API to get the top tracks
      try {
        let response = await fetch(
          "https://api.spotify.com/v1/me/top/artists",
          {
            method: 'GET',
            headers: {
              'Authorization': 'Bearer ' + accessToken,
              'Content-Type': 'application/json',
            }
          }
        );

        let responseJSON = await response.json();

        const options = {
          includeScore: true
        }

        // use fuse to perform a fuzzy search of the styles database
        const fuse = new Fuse(styles, options)

        // for debugging
        // let genres = responseJSON.items.reduce((acc, e) => acc.concat(e.genres), [])
        // console.log(genres);

        // search each genre for each artist using fuse and concatenate them together
        let genresSearchResults = responseJSON.items.reduce((acc, e) => acc.concat(
          e.genres.reduce((acc, e) => acc.concat(fuse.search(e)), [])), [])

        // sort the search results to get the best matches
        let bestMatches = genresSearchResults.sort((a, b) => a.score - b.score);

        // use the sorted results to create a set of unique genres with size GENRE_LIST_SIZE
        let GENRE_LIST_SIZE = 20;
        let genreSet = new Set([]);
        let i = 0;
        while (genreSet.size < GENRE_LIST_SIZE || i >= bestMatches.size) {
          genreSet.add(bestMatches[i].item);
          i++;
        }

        console.log(genreSet);
    } catch(error) {
        console.log(error);
      }

      return done(null, profile);
    }
  )
);


const app = express();

app.use(session({
  secret: 'keyboard cat',
  resave: true, // originally false
  saveUninitialized: true,  // originally false
  // store: new pgSession({
  //   pool : database.pool,                // Connection pool
  //   tableName : 'user_sessions'   // Use another table-name than the default "session" one
  // })
}));

// Add middleware to the Express app.
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logger('dev'));
app.use('/', express.static('client'));
// app.use('/login', express.static('client'));

app.get('/login', async (request, response) => {
  console.log('login prompt pressed');

});

// TODO: Implement the /getAlbums endpoint
app.post('/getAlbums', async (request, response) => {
  const options = request.body;
});

// GET /auth/spotify
//   Use passport.authenticate() as route middleware to authenticate the
//   request. The first step in spotify authentication will involve redirecting
//   the user to spotify.com. After authorization, spotify will redirect the user
//   back to this application at /auth/spotify/callback
app.get(
  '/auth/spotify',
  passport.authenticate('spotify', {
    scope: ['user-read-email', 'user-read-private', 'user-top-read'],
    showDialog: true,
  })
);

// GET /auth/spotify/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request. If authentication fails, the user will be redirected back to the
//   login page. Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get(
  authCallbackPath,
  passport.authenticate('spotify', {failureRedirect: '/login'}),
  function (req, res) {
    res.redirect('/');
  }
);

// an example of a route that includes the user's spotify information and will only work if the user is logged in with
// spotify
// app.get('/account', ensureAuthenticated, function (req, res) {
//   // res.render('account.html', {user: req.user});
//   res.json({ message: 'Hello World!', user: req.user });
// });

app.get('/account', async (request, response) => {
  // res.render('account.html', {user: req.user});

  if (request.user) {
    response.json(request.user );
  } else {
    response.status(401).send('Not authorized');
  }
});

// This matches all routes that are not defined.
app.all('*', async (request, response) => {
  response.status(404).send(`Not found: ${request.path}`);
});

// Start the server.
app.listen(port, () => {
  console.log(`Disc Cover listening on port ${port}!`);
});

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed. Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}
