import {Albums} from "./albums.js";
import {createAlbums, readStyles, readSessionUser} from "./crud.js";

const tags = document.getElementById('tags');
const albumPane = document.getElementById('albums');
const spotifyPane = document.getElementById('spotify_connect');
const styleSelect = document.getElementById('style_select_plc');
const spinner = document.getElementById('spinner');
const addTagButton = document.getElementById("add_tag");
const loadStylesButton = document.getElementById("load_styles");
const generateButton = document.getElementById("generate");

let albums = new Albums();
await albums.init(tags, styleSelect, albumPane);
albums.renderAlbums();
spinner.style.display = 'none';

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

addTagButton.addEventListener("click", async () => {
    // albums.addGenre(tags);
    await albums.addStyleFromSelect();
});

loadStylesButton.addEventListener("click", async () => {
    let styles = await readStyles(4);
    styles.every(async style => {
        return (await albums.addStyle(style)) !== -1;
    });
});

generateButton.addEventListener("click", async () => {
    if (albums.styles.length < 1) {
        alert("You must have at least one style selected to generate albums!")
        return;
    }
    spinner.style.display = 'block';
    albums.setAlbums(await createAlbums(albums.styles));
    albums.renderAlbums();
    spinner.style.display = 'none';
});

// Handle clicking on tags to remove them
document.addEventListener('click',async (e) => {
    if(e.target && e.target.id.slice(0, 10) === 'style-btn-'){
        await albums.deleteStyle(e.target.id);
    }
});