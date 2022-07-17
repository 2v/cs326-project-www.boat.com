import {getState, setState} from "./state.js";
import {styles} from "./styles.js";
import {readAlbums} from "./crud.js";

let placeholderImg = "images/placeholder.png";

// TODO: have file for constants like these?
const MAX_STYLES = 8;

export class Albums {
    constructor() {
    }

    async init(tagElement, styleSelectElement) {
        if (!(await this._restoreAlbumState())) {
            this.albums = new Array(2).fill([]).map(x => new Array(4).fill({
                'url': '/',
                'thumbnail': placeholderImg
            }));
        }

        this.tagElement = tagElement;
        this.styleSelectElement = styleSelectElement;

        this.styleList = new Set(styles);
        this.styles = [];
        this._restoreStyleState(tagElement);

        this.styleDefaultText = 'select a style';

        this.styleSelect = this._generateListSelect(this.styleList,
            this.styleSelectElement, this.styleDefaultText, 'style_select');

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

    async _restoreAlbumState() {
        // first attempt to restore albums from the database
        let albums = await readAlbums();
        if (albums.length > 0) {
            this.setAlbums(albums);
            return true;
        }

        // next attempt to save albums from local storage
        albums = getState('albums');
        if(albums) {
            this.albums = albums;
            return true;
        }

        return false;
    }

    _saveAlbumState() {
        setState('albums', this.albums);
    }

    _saveStyleState() {
        setState('styles', this.styles);
    }

    _restoreStyleState() {
        let styles = getState('styles');
        if (styles) {
            styles.forEach(style => this.addStyle(style, this.tagElement));
        }
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

        item.id = 'style-btn-'.concat(style);
        item.innerText = style;
        element.appendChild(item);

        this.styleList.delete(style);
        this.styles.push(style);

        this.styleSelect = this._generateListSelect(this.styleList,
          document.getElementById("style_select_plc"), this.styleDefaultText, 'style_select');

        this._saveStyleState();

        return 0;
    }

    deleteStyle(styleID) {
        let style = styleID.slice(10)
        console.log("DELETING STYLE ".concat(style));

        document.getElementById(styleID).remove();

        this.styleList.add(style);
        this.styles = this.styles.filter(x => x !== style);

        this.styleSelect = this._generateListSelect(this.styleList,
          document.getElementById("style_select_plc"), this.styleDefaultText, 'style_select');

        this._saveStyleState();

        return 0;
    }

    setAlbums(albums) {
        this.albums = new Array(2).fill([]).map((x, i) => new Array(4)
          .fill([]).map((y, j) => albums[i*4 + j]));
        this._saveAlbumState();
    }
}