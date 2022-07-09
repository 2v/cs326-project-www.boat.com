import {getState} from "./state.js";
import {styles} from "./styles.js";
import {genres} from "./genres.js";

let placeholderImg = "https://m.media-amazon.com/images/I/51CgMxpH7RL._SX425_.jpg";

export class Albums {
    constructor() {
        if (!this._restoreAlbumState()) {
            this.reset();
        }
    }

    reset() {
        this.albums = new Array(2).fill([]).map(x => new Array(4).fill(placeholderImg));
        this.styleList = new Set(styles);
        this.genreList = new Set(genres);

        this.genreDefaultText = 'select a genre';
        this.styleDefaultText = 'select a style (optional)';


        this.genreSelect = this._generateListSelect(this.genreList,
            document.getElementById("genre_select_plc"), this.genreDefaultText, 'genre_select');
        this.styleSelect = this._generateListSelect(this.styleList,
            document.getElementById("style_select_plc"), this.styleDefaultText, 'style_select');

        this.genres = [];
        this.styles = [];
        this.excludedArtists = [];
    }

    _generateListSelect(list, element, defaultText, id="") {
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

    _restoreAlbumState() {
        let albums = getState('albums');
        if(!albums) {
            return false;
        }

        this.albums = albums;
        return true;
    }

    _saveAlbumState() {
        setState('albums', this.albums);
    }

    renderAlbums(element) {
        element.innerHTML = '';

        let rowDiv = document.createElement('div');
        rowDiv.classList.add('row');

        this.albums.forEach(column => {
            let colDiv = document.createElement('div');
            colDiv.classList.add('col');

            column.forEach(imgURL => {

                let img = document.createElement('img');
                img.src = imgURL;
                img.alt = 'album';
                img.classList.add('img-thumbnail');

                colDiv.appendChild(img);
            })
            rowDiv.appendChild(colDiv);
        })
        element.appendChild(rowDiv);
    }


    generateAlbums() {
        // TODO: use scraping tools and current genre and style data to generate new albums

        this._saveAlbumState()
    }

    addGenre(element) {
        if(this.genreSelect.value === this.genreDefaultText) {
            return -1;
        }

        let item = document.createElement('button');
        item.type = 'button';
        item.classList.add('btn');
        item.classList.add('btn-primary');
        item.innerText = this.genreSelect.value;
        this.genreList.delete(this.genreSelect.value);
        this.genres.push(this.genreSelect.value);
        element.appendChild(item);

        this.genreSelect = this._generateListSelect(this.genreList,
            document.getElementById("genre_select_plc"), this.genreDefaultText, 'genre_select');
    }

    addStyle(element) {
        if(this.styleSelect.value === this.styleDefaultText) {
            return -1;
        }

        let item = document.createElement('button');
        item.type = 'button';
        item.classList.add('btn');
        item.classList.add('btn-primary');
        item.innerText = this.styleSelect.value;
        this.styleList.delete(this.styleSelect.value);
        this.styles.push(this.styleSelect.value);
        element.appendChild(item);

        this.styleSelect = this._generateListSelect(this.styleList,
            document.getElementById("style_select_plc"), this.styleDefaultText, 'style_select');
    }

    addExcludedArtist(element, inputField) {
        if(inputField.value === '') {
            return -1;
        }

        let item = document.createElement('button');
        item.type = 'button';
        item.classList.add('btn');
        item.classList.add('btn-secondary');
        item.innerText = inputField.value;
        this.excludedArtists.push(this.styleSelect.value);
        element.appendChild(item);
    }

    clearTags(element) {
        element.innerHTML = '';

        this.styleList = new Set(styles);
        this.genreList = new Set(genres);

        // regenerate the genre and style select boxes
        this.genreSelect = this._generateListSelect(this.genreList,
            document.getElementById("genre_select_plc"), this.genreDefaultText, 'genre_select');
        this.styleSelect = this._generateListSelect(this.styleList,
            document.getElementById("style_select_plc"), this.styleDefaultText, 'style_select');
        this.genres = [];
        this.styles = [];
    }

    clearExclusions(element) {
        element.innerHTML = '';

        this.excludedArtists = [];
    }

}