import 'dotenv/config';
import pg from 'pg';
import format from 'pg-format';

// Get the Pool class from the pg module.
const { Pool } = pg;

// TODO: add documentation to functions
class Database {
  constructor(dbURL) {
    this.dbURL = dbURL;
  }

  async connect() {
    // Create a new Pool. The Pool manages a set of connections to the database.
    // It will keep track of unused connections, and reuse them when new queries
    // are needed. The constructor requires a database URL to make the
    // connection. You can find the URL of your database by looking in Heroku
    // or you can run the following command in your terminal:
    //
    //  heroku pg:credentials:url -a APP_NAME
    //
    // Replace APP_NAME with the name of your app in Heroku.
    this.pool = new Pool({
      connectionString: this.dbURL,
      ssl: { rejectUnauthorized: false }, // Required for Heroku connections
    });

    // Create the pool.
    this.client = await this.pool.connect();

    // Init the database.
    await this.init();
  }

  async init() {
    const generateTables = `
      create table if not exists users (
        id varchar(128) primary key,
        ts bigint
      );

      create table if not exists user_styles (
          id varchar(128),
          style varchar (50)
          );

      create table if not exists user_albums (
          id varchar(128) primary key,
          albums varchar (40000)
          );
    `;
    const res = await this.client.query(generateTables);
  }

  // Close the pool.
  async close() {
    this.client.release();
    await this.pool.end();
  }

  /**
   * Save a list of styles to the database with a timestamp. Performs an upsert for both tables, removing the
   * existing user entry and adding a new one with the updated timestamp. Old style preferences are removed from
   * the styles table.
   *
   * @param {string} spotifyID
   * @param {string[]} styles
   * @param {int} ts
   */
  async saveStyles(spotifyID, styles, ts) {
    // perform UPSERT by deleting table if it exists and adding new entry
    await this.client.query(format('DELETE FROM users WHERE id = %L', spotifyID));
    await this.client.query(format('INSERT INTO users (id, ts) VALUES (%L, %L) RETURNING *', spotifyID, ts));

    // delete existing styles
    await this.client.query(format('DELETE FROM user_styles WHERE id = %L', spotifyID));

    let values = styles.map(style => [spotifyID, style]);
    await this.client.query(format('INSERT INTO user_styles (id, style) VALUES %L', values));
  }

  /**
   * Store an album array in the database. Serializes the album object and stores it with the user ID.
   *
   * @param {string} spotifyID
   * @param {Object[]} albums
   */
  async saveAlbums(spotifyID, albums) {
    await this.client.query(format('DELETE FROM user_albums WHERE id = %L', spotifyID));

    let albumsSerialized = JSON.stringify(albums);
    await this.client.query(format('INSERT INTO user_albums (id, albums) VALUES %L', [[spotifyID, albumsSerialized]]));
  }

  /**
   * Read a user.
   *
   * @param {string} spotifyID
   */
  async readUser(spotifyID) {
    const res = await this.client.query(format('SELECT * FROM users WHERE id = %L', spotifyID));
    return res.rows.reduce((acc, e) => e, []);
  }

  /**
   * Read a user's stored styles.
   *
   * @param {string} spotifyID
   */
  async readStyles(spotifyID) {
    const queryText =
      'SELECT style FROM user_styles WHERE id = ($1)'
    const res = await this.client.query(queryText, [spotifyID]);
    return res.rows.map(x => x.style);    // should return an empty array if no entries exist
  }

  /**
   * Remove a style preference for a user.
   *
   * @param {string} spotifyID
   * @param {string} style
   */
  async deleteStyle(spotifyID, style) {
    await this.client.query(format('DELETE FROM user_styles WHERE id = %L AND style = %L', spotifyID, style), [],
      (err, result) => {});
  }

  /**
   * Add a style preference for a user. This is performed as an upsert.
   *
   * @param {string} spotifyID
   * @param {string} style
   */
  async addStyle(spotifyID, style) {
    await this.deleteStyle(spotifyID, style);
    await this.client.query(format('INSERT INTO user_styles (id, style) VALUES %L', [[spotifyID, style]]), [],
      (err, result) => {
        console.log(err);
      });
  }

  /**
   * Read a user's albums.
   *
   * @param {string} spotifyID
   */
  async readAlbums(spotifyID) {
    const queryText =
      'SELECT * FROM user_albums WHERE id = ($1)'
    const res = await this.client.query(queryText, [spotifyID]);
    return res.rows.reduce((acc, e) => e, -1);  // return an item if there is any
  }
}

export const database = new Database(process.env.DATABASE_URL);