import express from 'express';
import logger from 'morgan';
import session from 'express-session';
import passport from 'passport';
import passportSpotify from 'passport-spotify';
import Fuse from 'fuse.js';
import { styles } from './styles.js'
import {database} from "./database.js";   // for when we use a database for serialization / deserialization

import epgSession from 'connect-pg-simple';
const pgSession = epgSession(session);

// import epgSession from 'express-pg-session';
// const pgSession = epgSession(session);

import {parseStylesFromTopArtists, shuffle} from "./utils.js";
import {generateAlbums} from "./discogs.js";


const SpotifyStrategy = passportSpotify.Strategy;

const authCallbackPath = '/auth/spotify/callback';

const port = process.env.PORT || 8888;

await database.connect();

// ----------------- EXPRESS / PASSPORT / SESSION SETUP ------------ //

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
      // TODO: add user's name to the database, this way we no longer have to interface with Spotify object
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

        const TIME_SECONDS_TO_RELOAD_ALBUMS = 60;
        let dbUser = await database.getStyles(profile.id);
        let today = new Date();

        // get style and album data if it doesn't exist in the table yet or if the data is stale
        if (dbUser.length < 1 || (today.getTime() - dbUser.ts)/1000 > TIME_SECONDS_TO_RELOAD_ALBUMS) {
          console.log('FETCHING NEW DATA FOR USER')
          let userStyles = parseStylesFromTopArtists(responseJSON, 20, styles);
          await database.saveStyles(profile.id, userStyles, today.getTime());
        }

        // console.log(userStyles);
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
  resave: true,
  saveUninitialized: true,
  store: new pgSession({
    pool: database.pool,
    tableName: 'user_sessions',
    createTableIfMissing: true
  })
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

// TODO: refactor this file to use req and res rather than request and response
app.get('/login', async (request, response) => {
  console.log('login prompt pressed');
});

app.get('/logout', function(req, res){
  req.logout(function() {
    res.redirect('/');
  });
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

// route that includes the user's spotify information and will only work if the user is logged in with spotify
app.get('/account', async (request, response) => {
  if (request.user) {
    response.json({'status': 'success', 'user': request.user});
  } else {
    response.status(401).json({'status': 'failure'});
  }
});


// --------------- CRUD OPERATIONS ------------------- //

// generates albums by searching discogs by style
app.post('/generateAlbums', async (req, res) => {
  const options = req.body;
  let albums = await generateAlbums(options.styles, 50, 150);

  // if the user is logged in, we want to save their albums to the database
  if (req.user) {
    await database.saveAlbums(req.user.id, albums);
  }

  res.json(albums);
});

app.get('/styles', async (req, res) => {
  const options = req.query;
  const styleCount = options.styleCount;

  if (req.user) {
    let userStyles = shuffle(JSON.parse((await database.getStyles(req.user.id)).styles)).slice(0, styleCount);
    res.json({'status': 'success', 'styles': userStyles});
  } else {
    res.status(401).json({'status': 'failure'});
  }
});

app.get('/albums', async (req, res) => {
  if (req.user) {
    let userAlbums = await database.getAlbums(req.user.id);
    if (userAlbums === -1) {
      res.json({'status': 'success', 'albums': []});
    } else {
      res.json({'status': 'success', 'albums': JSON.parse(userAlbums.albums)});
    }
  } else {
    res.status(401).json({'status': 'failure'});
  }
});

// -------------------- SETUP WEBSERVER --------------------- //

// This matches all routes that are not defined.
app.all('*', async (request, response) => {
  response.status(404).send(`Not found: ${request.path}`);
});

// Start the server.
app.listen(port, () => {
  console.log(`Disc Cover listening on port ${port}!`);
});

// await database.saveStyles('1001', ['rock', 'classical'], today.getTime());
// console.log(await database.getUser('1001'));