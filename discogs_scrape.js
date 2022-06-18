const axios = require('axios');
const cheerio = require('cheerio');

// a test file for scraping discogs. Prints all the image links from the specified discogs URL

axios
    .get('https://www.discogs.com/search/?type=release&sort=hot%2Cdesc&ev=em_tr&genre_exact=Hip+Hop&layout=big')
    .then((response) => {
        const $ = cheerio.load(response.data);
        const albums = $(".thumbnail_center");
        console.log(albums.attr("class"))
        console.log(albums.length)
        albums.each((i, e) => {
            console.log($(e).find('img').attr('data-src'))
        })
    })
