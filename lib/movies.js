const cheerio = require("cheerio"),
    request = require("request"),
    fs = require("fs");


var movies = {
    protocol: "http",
    url: "dl.my-film.org/reza/film",
    host: () => {
        return movies.protocol + "://" + movies.url;
    },
    page: 1,
    amount: {
        current: 99,
        fromValue: () => {
            return (movies.page * movies.amount.current) - movies.amount.current;
        },
        toValue: () => {
            return movies.page * movies.amount.current;
        }
    },
    init: () => {
        const self = this;
        if (options && options.url)
            self.url = options.url;

        if (options && options.secure)
            self.protocol = 'https:';

        return self;
    },
    helpers: {
        transformPathToTitle: (path) => {
            var title = path.toLowerCase();
            sizes = ['1080p', '720p', 'hdrip', '480p', '320p', '[my-film]'];
            sizes.forEach((size) => {
                if (title.indexOf(size) !== -1) {
                    title = title.split(size)[0].replace(/\./g, ' ').trim();
                }
            });
            return title;
        }
    },
    list: (done, options) => {
        setInterval(countUp, 1000);
        var self = this;
        var counter = 0;

        function countUp() {
            counter += 1;
        }

        if (options && options.page)
            movies.page = options.page;

        if (options && options.amount)
            movies.amount.current = options.amount;

        request(movies.host(), (error, response, html) => {
            if (!error) {
                var $ = cheerio.load(html),
                    results = [],
                    BreakException = {},
                    to = movies.amount.toValue(),
                    from = movies.amount.fromValue();

                try {
                    $("tr").each(function(index, value) {
                        if (index <= 3) return true;
                        if (index >= to) throw BreakException;

                        if (index <= to && index >= from) {
                            var children = $(this).children(),
                                path = $(children[0]).children().attr("href"),
                                title = movies.helpers.transformPathToTitle(path);
                            console.log(title);
                            /* pushing obj to array */
                            results.push({
                                title: title,
                                size: $(children[1]).text().trim(),
                                date: $(children[2]).text().trim(),
                                path: path
                            });
                        }
                    });
                } catch (e) {
                    if (e !== BreakException) throw e;
                }
                console.log("Finished in " + counter + " secs");
                done(error, JSON.stringify(results), counter);
            }
        });
    },
    download: (query, done) => {
        movies.list((err, results) => {
            results
        }, { page: 1, amount: 9000 })
    }
}

module.exports = movies;