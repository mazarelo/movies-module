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
        editDistance(s1, s2) {
            s1 = s1.toLowerCase();
            s2 = s2.toLowerCase();

            var costs = new Array();
            for (var i = 0; i <= s1.length; i++) {
                var lastValue = i;
                for (var j = 0; j <= s2.length; j++) {
                    if (i == 0)
                        costs[j] = j;
                    else {
                        if (j > 0) {
                            var newValue = costs[j - 1];
                            if (s1.charAt(i - 1) != s2.charAt(j - 1))
                                newValue = Math.min(Math.min(newValue, lastValue),
                                    costs[j]) + 1;
                            costs[j - 1] = lastValue;
                            lastValue = newValue;
                        }
                    }
                }
                if (i > 0)
                    costs[s2.length] = lastValue;
            }
            return costs[s2.length];
        },
        similarity(s1, s2) {
            var longer = s1;
            var shorter = s2;
            if (s1.length < s2.length) {
                longer = s2;
                shorter = s1;
            }
            var longerLength = longer.length;
            if (longerLength == 0) {
                return 1.0;
            }
            return (longerLength - movies.editDistance(longer, shorter)) / parseFloat(longerLength);
        },
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
            var BreakException = {};
            var similar = [];
            results.forEach((item) => {
                var isSimilar = similarity(item.title, query);
                console.log("Similar %: ", isSimilar);
                if (isSimilar >= 0.8) {
                    similar.push(item);
                }
            });
            done(similar);
        }, { page: 1, amount: 9000 })
    }
}

module.exports = movies;