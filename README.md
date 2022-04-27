# promise

This is a [Promise](https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-promise-objects) implementation for testing purposes.

Following is the main implementation file:

[src/Promise.js](src/Promise.js)

## Log

what i did

### constructor

- handle TypeError
- add `resolutionFunc` and `rejectFunc` methods to an instance of Promise
- call `executor`

### resolutionFunc

- enqueue a callback which change value and state of the Promise on microtask

### rejectFunc

- enqueue a callback which change value and state of the Promise on microtask

### then

- set default onFulfilled and onRejected callback when arguments is not a function
- enqueue a callback which change value and state of the Promise calling either onFulfilled or onRejected callback
- return this

### catch

- call this.then

## Development

```bash
$ npm i
```

## Test

```bash
# Run tests in headless chrome
$ npm run test:browser

# Generate coverage report
$ npm run test:coverage

# Run tests in headless chrome and generate coverage report
# Equivalent to "npm run test:browser && npm run test:coverage"
$ npm test
```

## License

MIT
