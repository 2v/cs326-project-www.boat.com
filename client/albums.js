import {getState, setState} from "./state.js";
import {deleteStyle, readAlbums, readStyleList, updateStyles} from "./crud.js";

const styles = await readStyleList();
const MAX_STYLES = 8;
let placeholderImg = "images/placeholder.png";

export class Albums {
    constructor() {
    }

    /**
     * Initializes the tag box, the tag selection form, and the album pane. Attempts to restore the album state, otherwise
     * placeholder album images are displayed. DOM elements are passed to the class and used in other methods, so init
     * *MUST* be called before calling any other methods in the Albums class
     *
     * @param {HTMLElement} tagElement the tag box element
     * @param {HTMLElement} styleSelectElement the style select form element
     * @param {HTMLElement} albumPaneElement the album panel element
     */
    async init(tagElement, styleSelectElement, albumPaneElement) {
        if (!(await this._restoreAlbumState())) {
            this.albums = new Array(2).fill([]).map(x => new Array(4).fill({
                'url': '/',
                'thumbnail': placeholderImg
            }));
        }

        this.tagElement = tagElement;
        this.styleSelectElement = styleSelectElement;
        this.albumPaneElement = albumPaneElement;

        this.styleList = new Set(styles);
        this.styles = [];
        await this._restoreStyleState();

        this.styleDefaultText = 'select a style';

        this.styleSelect = this._generateListSelect(this.styleList, this.styleDefaultText, 'style_select');

    }

    _generateListSelect(list, defaultText, id="") {
        this.styleSelectElement.innerHTML = '';

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
        this.styleSelectElement.appendChild(select);

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

    async _restoreStyleState() {
        let styles = getState('styles');
        if (styles) {
            for (let i = 0; i < styles.length; i++) {
                await this.addStyle(styles[i]);
            }
        }
    }

    /**
     * Renders the albums pane.
     *
     */
    renderAlbums() {
        this.albumPaneElement.innerHTML = '';

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
        this.albumPaneElement.appendChild(rowDiv);
    }

    /**
     * Adds the style that is currently selected on the select form this class was initialized with.
     *
     */
    async addStyleFromSelect() {
        if(this.styleSelect.value === this.styleDefaultText) {
            return -1;
        }

        let status = await this.addStyle(this.styleSelect.value, true);

        if (status === -1) {
            console.error('No such style exists in local database!')
        }
    }

    /**
     * Add a style.
     *
     * @param {string} style the style to add. Should be a part of the standard Discord style set
     * @param {boolean} pushToDB whether or not to push this update to the database. Not always necessary. For example,
     *          if we are restoring from local storage, we know that the tags have already been stored at some point
     *          in the database for that user, so making another call would be redundant.
     */
    async addStyle(style, pushToDB=false) {
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
        this.tagElement.appendChild(item);

        this.styleList.delete(style);
        this.styles.push(style);
        this._saveStyleState();

        // Update database with the new style
        if (pushToDB) { await updateStyles(style);}

        this.styleSelect = this._generateListSelect(this.styleList, this.styleDefaultText, 'style_select');


        return 0;
    }

    /**
     * Remove a style
     *
     * @param {string} styleID the ID of the style button to remove. ID contains a standard string ending in the style
     *              name so we can propagate this change to the database.
     */
    async deleteStyle(styleID) {
        let style = styleID.slice(10)
        document.getElementById(styleID).remove();

        this.styleList.add(style);
        this.styles = this.styles.filter(x => x !== style);
        this._saveStyleState();

        this.styleSelect = this._generateListSelect(this.styleList, this.styleDefaultText, 'style_select');

        // delete style from the database
        await deleteStyle(style);

        return 0;
    }

    /**
     * Set the class albums to an albums object.
     *
     * @param {Object[]} albums albums is a list of objects of the form: {'url': URL, 'thumbnail': THUMBNAIL}
     */
    setAlbums(albums) {
        this.albums = new Array(2).fill([]).map((x, i) => new Array(4)
          .fill([]).map((y, j) => albums[i*4 + j]));
        this._saveAlbumState();
    }
}