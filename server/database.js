import 'dotenv/config';
import pg from 'pg';

// Get the Pool class from the pg module.
const { Pool } = pg;

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
      create table if not exists user_styles (
        user_id varchar(128) primary key,
        -- we will serialize a user's list of style preferences and store it here
        styles varchar (512)
--         ts timestamp 
        -- TODO: implement timestamp so that we can avoid regenerating styles if they were
        --       generated recently
      );

      create table if not exists user_exclusions (
          user_id varchar(128) primary key,
          exclusions varchar (1024)
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
   */
  async saveStyles(spotifyID, styles) {
    // delete table entry if it exists
    const deleteText = 'DELETE FROM user_styles WHERE user_id = ($1)';
    await this.client.query(deleteText, [spotifyID]);

    let stylesSerialized = JSON.stringify(styles);
    const insertText = 'INSERT INTO user_styles (user_id, styles) VALUES ($1, $2) RETURNING *';
    await this.client.query(insertText, [spotifyID, stylesSerialized]);
  }

  /**
   *
   * @param {string} spotifyID
   */
  async getStyles(spotifyID) {
    const queryText =
      'SELECT styles FROM user_styles WHERE user_id = ($1)'
    const res = await this.client.query(queryText, [spotifyID]);
    return res.rows();
  }

}

export const database = new Database(process.env.DATABASE_URL);