# movies-module
node module to list movies from a specific url

### dependencies
node-localdb request cheerio

## no options..
```
movies.list((err, results) => {
    console.log(results);
})
```

## with options
```
// page,amount-per-page, callback()
movies.list((err, results) => {
    console.log(results);
},{ page: 1, amount: 50 });
```

## query for results
```
// page,amount-per-page, callback()
movies.query("The query here" ,(results) => {
    console.log(results);
});
```

## response
```
[
    {
        date: "2016-Jun-04 07:01",
        title: "10 cloverfield lane 2016",
        path: "10.cloverfield.lane.2016.1080p.mkv"
        size: "2G"
    },
    ...
]
```
