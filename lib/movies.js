const cheerio = require("cheerio"),
    request = require("request");


var movies = {
    host: this.protocol + "://" + this.url,
    url: "dl.my-film.org/reza/film",
    page: 1,
    protocol: "http",
    amount: {
        current: 20,
        from: () => {
            return (this.page * this.amount.current) - this.amount.current;
        },
        to: () => {
            return this.page * this.amount.current;
        }
    },
    init: (options) => {
        const self = this;
        if (options && options.url)
            self.url = options.url;

        if (options && options.secure)
            self.protocol = 'https:';

        return self;
    },
    list: (page = this.page, amount = this.amount.current, done) => {
        var self = this;

        request(this.host, function(error, response, html) {
            if (!error) {
                var $ = cheerio.load(html),
                    results = [];

                $("tr").each(function(index, value) {
                    let to = self.amount.to();
                    let from = self.amount.from();

                    if (index <= from) return true;
                    if (index >= to) return false;

                    if (index <= to) {
                        var children = $(this).children();
                        /* pushing obj to array */
                        self.results.push({
                            size: $(children[1]).text().trim(),
                            title: $(children[0]).children().attr("href"),
                            date: $(children[2]).text().trim()
                        });
                    }
                });
                done(err, JSON.stringify(results));
            }
        });
    }
}

module.exports = movies.init;