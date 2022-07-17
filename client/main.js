import {Albums} from "./albums.js";
import {createAlbums, readStyles, readSessionUser} from "./crud.js";

const tags = document.getElementById('tags');
const excludedArtists = document.getElementById('excluded_artists');
const albumPane = document.getElementById('albums');
const spotifyPane = document.getElementById('spotify_connect');
const styleSelect = document.getElementById('style_select_plc');

let albums = new Albums();
await albums.init(tags, styleSelect);
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

document.getElementById("load_styles").addEventListener("click", async () => {
    let styles = await readStyles(4);
    styles.every(async style => {
        return (await albums.addStyle(style, tags)) !== -1;
    });
});

document.getElementById("generate").addEventListener("click", async () => {
    if (albums.styles.length < 1) {
        alert("You must have at least one style selected to generate albums!")
        return;
    }
    albums.setAlbums(await createAlbums(albums.styles));
    albums.renderAlbums(albumPane);
});

// Handle clicking on tags to remove them
document.addEventListener('click',function(e){
    if(e.target && e.target.id.slice(0, 10) === 'style-btn-'){
        albums.deleteStyle(e.target.id);
        //do something
    }
});