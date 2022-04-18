# promise

This is a [Promise](https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-promise-objects) implementation for testing purposes.

Following is the main implementation file:

[src/Promise.js](src/Promise.js)

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
