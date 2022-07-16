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

import {parseStylesFromTopArtists} from "./utils.js";


const SpotifyStrategy = passportSpotify.Strategy;

const authCallbackPath = '/auth/spotify/callback';

const port = process.env.PORT || 8888;

await database.connect();


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
        let dbUser = await database.getUser(profile.id);
        let today = new Date();
        if (dbUser.length < 1 || (today.getTime() - dbUser.ts)/1000 > TIME_SECONDS_TO_RELOAD_ALBUMS) {
          let userStyles = parseStylesFromTopArtists(responseJSON, 20, styles);
          // TODO: get albums here and save them to database
          await database.saveStyles(profile.id, userStyles, today.getTime());
        } else {
          // TODO: reload the user's saved styles and albums from database
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
  resave: true, // originally false
  saveUninitialized: true,  // originally false
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
  if (request.user) {
    response.json({'status': 'success', 'user': request.user});
  } else {
    response.status(401).json({'status': 'failure'});
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

let today = new Date();
console.log(today.getTime())

await database.saveStyles('1001', ['rock', 'classical'], today.getTime());
console.log(await database.getUser('1001'));