import {Albums} from "./albums.js";

const tags = document.getElementById('tags');
const excludedArtists = document.getElementById('excluded_artists');
const albumPane = document.getElementById('albums');

let albums = new Albums();
albums.renderAlbums(albumPane);


document.getElementById("add_tag").addEventListener("click", () => {
    document.getElementById('loginModal').ariaModal
    albums.addGenre(tags);
    albums.addStyle(tags);
});

document.getElementById("clear_tags").addEventListener("click", () => {
    albums.clearTags(tags);
});

document.getElementById("clear_excluded_artists").addEventListener("click", () => {
    albums.clearExclusions(excludedArtists);
});

document.getElementById('add_excluded_artist').addEventListener('click', () => {
    albums.addExcludedArtist(excludedArtists, document.getElementById('exclude_artist_input'));
});

// TODO: using local storage to keep persistence with the input data