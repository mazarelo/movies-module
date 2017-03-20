# movies-module
node module to list movies from a specific url


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

## response
```
[
    {
        date: "2016-Jun-04 07:01",
        title: "10.Cloverfield.lane.2016...",
        size: "2G"
    },
    ...
]
```
