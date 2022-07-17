# Disc Cover
### What is Disc Cover?
Disc cover is a one-page app which profiles a user's Spotify account to find styles they are interested in. It then performs a search on Discogs for new and relevant music and displays it in a tile format. Additional styles can be added and removed. A user can also generate albums without being logged in, they simply have to select some styles. 

### How to run?
Use `npm start` after performing `npm install`.

### Note on spotify connections
Currently, only users specifically added by me can use the app. To allow for any user to login with Spotify, I need to submit a Quota Extension through the Spotify developer portal. This will take some time to be approved. Please contact me if you want to be added explicitly.

### Note: additional libraries used:
- Passport-Spotify (https://www.passportjs.org/packages/passport-spotify/): a Passport strategy for authenticating with spotify
- connect-pg-simple (https://www.npmjs.com/package/connect-pg-simple): used with passport to maintain session for a logged-in user
- Fuse (https://fusejs.io/): a small library for performing a fuzzy search on an array of strings.
