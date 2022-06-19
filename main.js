// initialize genre selection

import {styles} from "./styles.js";
import {genres} from "./genres.js";
import {Albums} from "./albums.js";

let styleList = new Set(styles);
let genreList = new Set(genres);

let genreDefaultText = 'select a genre';
let styleDefaultText = 'select a style (optional)';

const tags = document.getElementById('tags');
const albumPane = document.getElementById('albums');

let genreSelect = generateListSelect(genreList,
    document.getElementById("genre_select_plc"), genreDefaultText, 'genre_select');
let styleSelect = generateListSelect(styleList,
    document.getElementById("style_select_plc"), styleDefaultText, 'style_select');

let albums = new Albums();
albums.render(albumPane);

document.getElementById("add_tag").addEventListener("click", () => {
    let item = null;
    if(genreSelect.value !== genreDefaultText) {
        item = document.createElement('button');
        item.type = 'button';
        item.classList.add('btn');
        item.classList.add('btn-primary');
        item.innerText = genreSelect.value;
        genreList.delete(genreSelect.value);
        tags.appendChild(item);
        genreSelect = generateListSelect(genreList,
            document.getElementById("genre_select_plc"), genreDefaultText, 'genre_select');
    }

    if(styleSelect.value !== styleDefaultText) {
        item = document.createElement('button');
        item.type = 'button';
        item.classList.add('btn');
        item.classList.add('btn-primary');
        item.innerText = styleSelect.value;
        styleList.delete(styleSelect.value);
        tags.appendChild(item);
        styleSelect = generateListSelect(styleList,
            document.getElementById("style_select_plc"), styleDefaultText, 'style_select');
    }
})

document.getElementById("clear_tags").addEventListener("click", () => {
    tags.innerHTML = '';

    styleList = new Set(styles);
    genreList = new Set(genres);

    genreSelect = generateListSelect(genreList,
        document.getElementById("genre_select_plc"), genreDefaultText, 'genre_select');
    styleSelect = generateListSelect(styleList,
        document.getElementById("style_select_plc"), styleDefaultText, 'style_select');

})

function generateListSelect(list, element, defaultText, id="") {
    element.innerHTML = '';
    const select = document.createElement('select');
    select.classList.add('form-select');
    select.id = id;

    let option = document.createElement('option');
    option.innerText = defaultText;
    select.appendChild(option);

    [...list].sort().forEach(text => {
        option = document.createElement('option');
        option.value = text;
        option.innerText = text;
        select.appendChild(option);
    });
    element.appendChild(select);

    return select;
}

// TODO: set up artist exclusion
// TODO: using local storage to keep persistence with the input data
