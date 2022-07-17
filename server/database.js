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
--         styles varchar (512),
        ts bigint
      );

      create table if not exists user_styles (
          id varchar(128),
          style varchar (50)
--           ts bigint
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
   *
   * @param {string} spotifyID
   * @param {string[]} styles
   * @param {int} ts
   */
  async saveStyles(spotifyID, styles, ts) {
    // perform UPSERT by deleting table if it exists and adding new entry
    const deleteText = 'DELETE FROM users WHERE id = ($1)';
    await this.client.query(deleteText, [spotifyID]);

    const insertText = 'INSERT INTO users (id, ts) VALUES ($1, $2) RETURNING *';
    await this.client.query(insertText, [spotifyID, ts]);


    let values = styles.map(style => [spotifyID, style]);
    this.client.query(format('INSERT INTO user_styles (id, style) VALUES %L', values), [],
      (err, result) => {
        console.log(err);
    });
  }

  /**
   *
   * @param {string} spotifyID
   * @param {string[]} styles
   * @param {int} ts
   */
  async saveAlbums(spotifyID, albums) {
    // perform UPSERT by deleting table if it exists and adding new entry
    const deleteText = 'DELETE FROM user_albums WHERE id = ($1)';
    await this.client.query(deleteText, [spotifyID]);

    let albumsSerialized = JSON.stringify(albums);

    const insertText = 'INSERT INTO user_albums (id, albums) VALUES ($1, $2) RETURNING *';
    await this.client.query(insertText, [spotifyID, albumsSerialized]);
  }

  /**
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
   *
   * @param {string} spotifyID
   * @param {string} style
   */
  async deleteStyle(spotifyID, style) {
    this.client.query(format('DELETE FROM user_styles WHERE id = %L AND style = %L', spotifyID, style), [],
      (err, result) => {});
  }

  /**
   *
   * @param {string} spotifyID
   * @param {string} style
   */
  async addStyle(spotifyID, style) {
    await this.deleteStyle(spotifyID, style);
    this.client.query(format('INSERT INTO user_styles (id, style) VALUES %L', [[spotifyID, style]]), [],
      (err, result) => {
        console.log(err);
      });
  }

  /**
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