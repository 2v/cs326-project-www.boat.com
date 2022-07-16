import {Albums} from "./albums.js";
import {getStyles, readSessionUser} from "./crud.js";

const tags = document.getElementById('tags');
const excludedArtists = document.getElementById('excluded_artists');
const albumPane = document.getElementById('albums');
const spotifyPane = document.getElementById('spotify_connect');

let albums = new Albums();
albums.renderAlbums(albumPane);

// display the user's spotify name if they are logged in
const sessionUser = await readSessionUser();
if (sessionUser.status === 'success') {
    // The user is logged in on this session. Thus, we want to display their username and fetch their current list of
    // albums, their tags, and their excluded artists from the database
    spotifyPane.innerHTML = `
        <h4>hello, ${sessionUser.user.displayName}</h4>
        <a class="btn btn-warning btn-lg btn-block" href="/logout" role="button">log out</a>
    `
} else {
    spotifyPane.innerHTML = `
        <p>connect your Spotify account to automatically determine your preferences, or enter your preferences below.</p>
        <a class="btn btn-success btn-lg btn-block" href="/auth/spotify" role="button">connect with spotify</a>
    `
}

// TODO: tags should persist in browser local storage
// TODO: define DOM elements as constants at top of document to clean up main file
document.getElementById("add_tag").addEventListener("click", () => {
    // albums.addGenre(tags);
    albums.addStyleFromSelect(tags);
});

document.getElementById("clear_tags").addEventListener("click", () => {
    albums.clearTags(tags);
});

document.getElementById("load_styles").addEventListener("click", async () => {
    let styles = await getStyles(4);
    styles.forEach(style => albums.addStyle(style, tags));
});

document.getElementById("clear_excluded_artists").addEventListener("click", () => {
    albums.clearExclusions(excludedArtists);
});

document.getElementById('add_excluded_artist').addEventListener('click', () => {
    albums.addExcludedArtist(excludedArtists, document.getElementById('exclude_artist_input'));
});
