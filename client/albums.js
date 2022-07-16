import {getState} from "./state.js";
import {styles} from "./styles.js";
import {getAlbums} from "./crud.js";

let placeholderImg = "images/placeholder.png";

// TODO: have file for constants like these?
const MAX_STYLES = 8;

export class Albums {
    constructor() {
    }

    async init() {
        if (!this._restoreAlbumState()) {
            await this.reset();
        }
    }

    async reset() {
        this.albums = new Array(2).fill([]).map(x => new Array(4).fill({
            'url': '/',
            'thumbnail': placeholderImg
        }));

        let userAlbums = await getAlbums();
        console.log(userAlbums);
        if (userAlbums.length > 0) { this.setAlbums(userAlbums); }

        this.styleList = new Set(styles);

        this.styleDefaultText = 'select a style';

        this.styleSelect = this._generateListSelect(this.styleList,
            document.getElementById('style_select_plc'), this.styleDefaultText, 'style_select');

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

            column.forEach(album => {

                let imgLink = document.createElement('a');
                imgLink.href = album.url;

                let img = document.createElement('img');
                img.src = album.thumbnail;
                img.alt = 'album';
                img.classList.add('img-thumbnail');

                imgLink.appendChild(img);

                colDiv.appendChild(imgLink);
            })
            rowDiv.appendChild(colDiv);
        })
        element.appendChild(rowDiv);
    }

    addStyleFromSelect(element) {
        if(this.styleSelect.value === this.styleDefaultText) {
            return -1;
        }

        let status = this.addStyle(this.styleSelect.value, element);

        if (status === -1) {
            console.error('No such style exists in local database!')
        }
    }

    addStyle(style, element) {
        if (!this.styleList.has(style)) {
            return -1;
        }

        if (this.styles.length >= MAX_STYLES) {
            alert("You can have at most 8 styles!")
            return -1;
        }

        let item = document.createElement('button');
        item.type = 'button';
        item.classList.add('btn');
        item.classList.add('btn-primary');
        item.classList.add('style-btn');
        item.innerText = style;
        element.appendChild(item);

        this.styleList.delete(style);
        this.styles.push(style);

        this.styleSelect = this._generateListSelect(this.styleList,
          document.getElementById("style_select_plc"), this.styleDefaultText, 'style_select');

        return 0;
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

        // regenerate the genre and style select boxes
        this.styleSelect = this._generateListSelect(this.styleList,
            document.getElementById("style_select_plc"), this.styleDefaultText, 'style_select');
        this.styles = [];
    }

    clearExclusions(element) {
        element.innerHTML = '';
        this.excludedArtists = [];
    }

    setAlbums(albums) {
        this.albums = new Array(2).fill([]).map((x, i) => new Array(4)
          .fill([]).map((y, j) => albums[i*4 + j]));
    }

}