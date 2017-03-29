"use strict";

var cheerio = require("cheerio"),
    request = require("request"),
    db = require('node-localdb'), //https://github.com/progrape/node-localdb
    moviesDb = db('db/movies.json'),
    find = require("../helpers/similarities"),
    text = require("../helpers/textHelpers");

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
                                            title = text.pathToTitle(path);
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
    query: (q, done) => {
        console.log("Query initialized");
        var query = q.toLowerCase();
        movies.list((err, results) => {
            var BreakException = {};
            var similar = [];
            var data = JSON.parse(results);
            console.log("has :", data.feed.length);
            for (var i = 0, len = data.feed.length; i < len; i++) {
                var isSimilar = find.similarity(data.feed[i].title, query);
                if (isSimilar >= 0.3) {
                    similar.push(data.feed[i]);
                } else if (data.feed[i].title.toLowerCase().includes(query)) {
                    similar.push(data.feed[i]);
                }
                console.log("Similar %: ", isSimilar);
            };
            done(JSON.stringify(similar));
        }, { page: 1, amount: 0 });
    }
}

module.exports = movies;

movies.query("ac", (results) => {
    console.log(results);
})