import express from 'express';
import logger from 'morgan';
import {getAlbums} from "./discogs.js";

const app = express();
const port = process.env.PORT || 3000;

// Add middleware to the Express app.
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logger('dev'));
app.use('/', express.static('client'));

// TODO: Implement the /getAlbums endpoint
app.post('/getAlbums', async (request, response) => {
  const options = request.body;
});

// This matches all routes that are not defined.
app.all('*', async (request, response) => {
  response.status(404).send(`Not found: ${request.path}`);
});

// Start the server.
app.listen(port, () => {
  console.log(`Disc Cover listening on port ${port}!`);
});

await getAlbums();