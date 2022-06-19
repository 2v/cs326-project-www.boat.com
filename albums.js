import {getState} from "./state.js";

let placeholderImg = "https://m.media-amazon.com/images/I/51CgMxpH7RL._SX425_.jpg";

export class Albums {
    constructor() {
        if (!this._restoreAlbumState()) {
            this.reset();
        }
    }

    reset() {
        this.albums = new Array(2).fill([]).map(x => new Array(4).fill(placeholderImg));
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

    render(element) {
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
}