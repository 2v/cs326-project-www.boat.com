// some documentation from Passport Spotify example code (https://github.com/JMPerez/passport-spotify)
import express from 'express';
import logger from 'morgan';
import session from 'express-session';
import passport from 'passport';
import passportSpotify from 'passport-spotify';
import { styles } from './styles.js'
import {database} from "./database.js";   // for when we use a database for serialization / deserialization

import epgSession from 'connect-pg-simple';
const pgSession = epgSession(session);

import {parseStylesFromTopArtists, shuffle} from "./utils.js";
import {generateAlbums} from "./discogs.js";


// TODO: add documentation to functions
const SpotifyStrategy = passportSpotify.Strategy;

const authCallbackPath = '/auth/spotify/callback';

const port = process.env.PORT || 8888;

await database.connect();

// ----------------- EXPRESS / PASSPORT / SESSION SETUP ------------ //


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

        const TIME_SECONDS_TO_RELOAD_STYLES = 60;
        let dbUser = await database.readUser(profile.id);
        let currTime = (new Date()).getTime();

        // get style and album data if it doesn't exist in the table yet or if the data is stale
        if (dbUser.length < 1 || (currTime - dbUser.ts)/1000 > TIME_SECONDS_TO_RELOAD_STYLES) {
          console.log('FETCHING NEW DATA FOR USER')
          let userStyles = parseStylesFromTopArtists(responseJSON, 20, styles);
          await database.saveStyles(profile.id, userStyles, currTime);
        }
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
//   login page. Otherwise, the primary route function will be called,
//   which, in this example, will redirect the user to the home page.
app.get(
  authCallbackPath,
  passport.authenticate('spotify', {failureRedirect: '/login'}),
  function (req, res) {
    res.redirect('/');
  }
);

// route that includes the user's spotify information and will only work if the user is logged in with spotify
app.get('/account', async (req, res) => {
  if (req.user) {
    res.json({'status': 'success', 'user': req.user});
  } else {
    res.status(401).json({'status': 'failure'});
  }
});


// --------------- CRUD OPERATIONS ------------------- //

// generates albums by searching discogs by style
app.post('/createAlbums', async (req, res) => {
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
    let userStyles = await database.readStyles(req.user.id);
    res.json({'status': 'success', 'styles': shuffle(userStyles).slice(0, styleCount) });
  } else {
    res.status(401).json({'status': 'failure'});
  }
});

app.get('/albums', async (req, res) => {
  if (req.user) {
    let userAlbums = await database.readAlbums(req.user.id);
    if (userAlbums === -1) {
      res.json({'status': 'success', 'albums': []});
    } else {
      res.json({'status': 'success', 'albums': JSON.parse(userAlbums.albums)});
    }
  } else {
    res.status(401).json({'status': 'failure'});
  }
});

app.delete('/deleteStyle', async (req, res) => {
  const options = req.query;
  if (req.user) {
    await database.deleteStyle(req.user.id, options.style);
  } else {
    res.status(401).json({'status': 'failure'});
  }
});

app.post('/updateStyles', async (req, res) => {
  const options = req.query;
  if (req.user) {
    await database.addStyle(req.user.id, options.newStyle);
  } else {
    res.status(401).json({'status': 'failure'});
  }
});

// -------------------- SETUP WEBSERVER --------------------- //

// This matches all routes that are not defined.
app.all('*', async (req, res) => {
  res.status(404).send(`Not found: ${req.path}`);
});

// Start the server.
app.listen(port, () => {
  console.log(`Disc Cover listening on port ${port}!`);
});

// close database when we stop program
process.on('SIGINT', async function () {
  await database.close();
  process.exit();
})