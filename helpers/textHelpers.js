"use strict";

var pathToTitle = (path) => {
    var title = path.toLowerCase();
    sizes = ['1080p', '720p', 'hdrip', '480p', '320p', '[my-film]'];
    sizes.forEach((size) => {
        if (title.indexOf(size) !== -1) {
            title = title.split(size)[0].replace(/\./g, ' ').trim();
        }
    });
    return title;
}

module.exports = pathToTitle;