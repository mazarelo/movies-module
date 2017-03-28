var cheerio = require("cheerio"),
    request = require("request"),
    db = require('node-localdb'), //https://github.com/progrape/node-localdb
    moviesDb = db('db/movies.json');

var movies = {
    protocol: "http",
    url: "dl5.nightsdl.com/Masih/Film/2016/",
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
    filters: {
        years: () => {

        }
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
            return (longerLength - movies.helpers.editDistance(longer, shorter)) / parseFloat(longerLength);
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
                moviesDb.findOne({ id: 'movies-2016' }).then(resultsDb => {
                    if (resultsDb == undefined) {
                        var $ = cheerio.load(html),
                            results = [],
                            BreakException = {},
                            to = movies.amount.toValue(),
                            from = movies.amount.fromValue();
                        try {
                            $("tr").each(function(index, value) {
                                if (index <= 3) return true;
                                if (index >= to && to !== 0) throw BreakException;

                                if (index <= to && index >= from) {
                                    try {
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
                                    } catch (err) { console.log(err) }
                                }
                            });
                        } catch (e) {
                            if (e !== BreakException) throw e;
                        }
                        console.log("Finished in " + counter + " secs");
                        moviesDb.insert({ id: "movies-2016", feed: results, date: new Date().getTime() }).then(function(feed) {
                            console.log(feed);
                        });
                        done(error, JSON.stringify(results), counter);
                    } else {
                        done(error, JSON.stringify(resultsDb), counter);
                    }
                });
            }
        });
    },
    query: (query, done) => {
        movies.list((err, results) => {
            var BreakException = {};
            var similar = [];
            var book = JSON.parse(results);
            for (var i = 0, len = book.length; i < len; i++) {
                var isSimilar = movies.helpers.similarity(book[i].title, query);
                console.log("Similar %: ", isSimilar);
                if (isSimilar >= 0.3) {
                    similar.push(book[i]);
                }
            };
            done(JSON.stringify(similar));
        }, { page: 1, amount: 0 });
    }
}

module.exports = movies;

movies.list((err, results) => {
    console.log(results);
})