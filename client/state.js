/**
 *  This function parses data stored in JSON format with an associated key from
 *  local storage. Returns this data or null if the key is not in the local storage object.
 *
 * @param {string} key the key for the item to retrieve from local storage
 * @returns {string | null} the value in local storage associate with the key
 */
export function getState(key) {
    let data = window.localStorage.getItem(key);
    return (data === undefined) || (data === null) ? null : JSON.parse(data);
}

/**
 * Store a value in local storage using a key value pair.
 *
 * @param {string} key the key for the item to store in local storage
 * @param {string} value the value to store
 * @returns {undefined}
 */
export function setState(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Clear the object in local storage with the associated key.
 *
 * @param {string} key the key for the item to remove from local storage
 * @returns {undefined}
 */
export function clearState(key) {
    window.localStorage.removeItem(key);
}