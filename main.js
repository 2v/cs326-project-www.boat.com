// initialize genre selection

import {styles} from "./styles.js";
import {genres} from "./genres.js";

let styleList = new Set(styles);
let genreList = new Set(genres);


let genreDefaultText = 'select a genre';
let styleDefaultText = 'select a style (optional)';

const tags = document.getElementById('tags');

let genreSelect = generateListSelect(genreList,
    document.getElementById("genre_select_plc"), genreDefaultText, 'genre_select');
let styleSelect = generateListSelect(styleList,
    document.getElementById("style_select_plc"), styleDefaultText, 'style_select');

document.getElementById("add_tag").addEventListener("click", () => {
    console.log(genreSelect.value);
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

document.getElementById("style_select").addEventListener("click", () => {
    console.log(styleSelect.value);
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

// TODO: implement clear button functionality
// TODO: generate the album cover pane dynamically (using placeholder images before we set up API)
// TODO: set up artist exclusion
// TODO: using local storage to keep persistence with the input data
