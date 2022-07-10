import express from 'express';
import logger from 'morgan';
import session from 'express-session';
import passport from 'passport';
import passportSpotify from 'passport-spotify';

import pg from 'pg';
import pgSession from 'express-pg-session';   // for when we use a database for serialization / deserialization

import {getAlbums} from "./discogs.js";

const SpotifyStrategy = passportSpotify.Strategy;
const authCallbackPath = '/auth/spotify/callback';

const port = process.env.PORT || 8888;

// TODO: look into using a database for maintaining session
//
// const pgPool = new pg.Pool({
//   // Create a new Pool. The Pool manages a set of connections to the database.
//   // It will keep track of unused connections, and reuse them when new queries
//   // are needed. The constructor requires a database URL to make the
//   // connection. You can find the URL of your database by looking in Heroku
//   // or you can run the following command in your terminal:
//   //
//   //  heroku pg:credentials:url -a APP_NAME
//   //
//   // Replace APP_NAME with the name of your app in Heroku.
//   connectionString: this.dburl,
//   ssl: { rejectUnauthorized: false }, // Required for Heroku connections
// });
//
// // create the pool
// const client = await pgPool.connect();

// example code from: https://github.com/JMPerez/passport-spotify
// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session. Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing. However, since this example does not
//   have a database of user records, the complete spotify profile is serialized
//   and deserialized.
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
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
      console.log(accessToken);

      // a test of using the spotify API to get the top tracks
      try {
        let response = await fetch(
          "https://api.spotify.com/v1/me/top/tracks",
          {
            method: 'GET',
            headers: {
              'Authorization': 'Bearer ' + accessToken,
              'Content-Type': 'application/json',

            }
          }
        );
        console.log(response.ok);
        console.log(await response.json());
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
  //   pool : pgPool,                // Connection pool
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
app.get('/account', ensureAuthenticated, function (req, res) {
  // res.render('account.html', {user: req.user});
  res.json({ message: 'Hello World!', user: req.user });
});

// This matches all routes that are not defined.
app.all('*', async (request, response) => {
  response.status(404).send(`Not found: ${request.path}`);
});

// Start the server.
app.listen(port, () => {
  console.log(`Disc Cover listening on port ${port}!`);
});

// await getAlbums();

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
