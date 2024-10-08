const { expect } = require('chai')
const { createSpy } = require('./test-utils')
const Promise = require('./Promise')

const unhandledRejections = []
const unhandledRejectionPromises = new Set()

const unhandledRejectionHandler = (rejection, promise) => {
  // mocha makes unhandledRejection event emitted twice
  // https://github.com/mochajs/mocha/issues/4743
  if (!unhandledRejectionPromises.has(promise)) {
    unhandledRejections.push(rejection)
    unhandledRejectionPromises.add(promise)
  }
}

if (typeof window !== 'undefined') {
  const browserUnhandledRejectionHandler = (event) => {
    unhandledRejectionHandler(event.reason, event.promise)
  }

  before(() => {
    window.addEventListener(
      'unhandledrejection',
      browserUnhandledRejectionHandler,
    )
  })

  after(() => {
    window.removeEventListener(
      'unhandledrejection',
      browserUnhandledRejectionHandler,
    )
  })
} else {
  before(() => {
    process.on('unhandledRejection', unhandledRejectionHandler)
  })

  after(() => {
    process.off('unhandledRejection', unhandledRejectionHandler)
  })
}

afterEach(() => {
  unhandledRejections.length = 0
  unhandledRejectionPromises.clear()
})

describe('new Promise(executor)', () => {
  it('throws TypeError when executor is not a function', () => {
    expect(() => {
      new Promise()
    }).to.throw('Promise resolver undefined is not a function')

    expect(() => {
      new Promise(123)
    }).to.throw('Promise resolver 123 is not a function')
  })

  it('calls executor and resolves or rejects the promise asynchronously', (done) => {
    const events = []

    setTimeout(() => {
      events.push('next tick')

      expect(events).to.deep.equal([
        'executor 1',
        'executor 2',
        'task is over',
        'queueMicrotask 1',
        'resolved: 123',
        'rejected: 456',
        'queueMicrotask 2',
        'next tick',
      ])

      done()
    }, 0)

    queueMicrotask(() => {
      events.push('queueMicrotask 1')
    })

    new Promise((resolve) => {
      events.push('executor 1')
      resolve(123)
    }).then((value) => {
      events.push(`resolved: ${value}`)
    })

    new Promise((_resolve, reject) => {
      events.push('executor 2')
      reject(456)
    }).catch((reason) => {
      events.push(`rejected: ${reason}`)
    })

    queueMicrotask(() => {
      events.push('queueMicrotask 2')
    })

    events.push('task is over')
  })

  it('emits unhandledRejection event when rejection is not handled', (done) => {
    new Promise((_, reject) => reject('not handled 1'))
    new Promise((_, reject) => reject('not handled 2'))

    queueMicrotask(() => {
      expect(unhandledRejections).to.deep.equal([])

      setTimeout(() => {
        // some browser fire unhandledrejection event in the next tick
        setTimeout(() => {
          expect(unhandledRejections).to.deep.equal([
            'not handled 1',
            'not handled 2',
          ])
          done()
        }, 0)
      }, 0)
    })
  })

  it('ignores duplicate resolve and reject function calls', (done) => {
    new Promise((resolve, reject) => {
      resolve(1)
      reject(2)
      resolve(3)
    }).then((value) => {
      expect(value).to.equal(1)

      new Promise((resolve, reject) => {
        reject(1)
        resolve(2)
        reject(3)
      }).catch((reason) => {
        expect(reason).to.equal(1)
        done()
      })
    })
  })
})

describe('Promise.prototype.then(onFulfilled, onRejected)', () => {
  describe('When promise resolves', () => {
    describe('When onFulfilled is not a function', () => {
      it("returns promise which is fulfilled with the original promise's value as its value", (done) => {
        Promise.resolve(123)
          .then()
          .then((value) => {
            expect(value).to.equal(123)
            done()
          })
      })
    })

    describe('When onFulfilled is a function', () => {
      describe('When onFulfilled returns a value', () => {
        it("returns promise which is fulfilled with onFulfilled's return value as its value", (done) => {
          Promise.resolve(123)
            .then((value) => value * 2)
            .then((value) => {
              expect(value).to.equal(246)
              done()
            })
        })
      })

      describe('When onFulfilled does not return anything', () => {
        it('returns promise which is fulfilled with undefined as its value', (done) => {
          Promise.resolve(123)
            .then((_) => {})
            .then((value) => {
              expect(value).to.equal(undefined)
              done()
            })
        })
      })

      describe('When onFulfilled throws an error', () => {
        it('returns promise which gets rejected with the thrown error as its value', (done) => {
          Promise.resolve(123)
            .then((_) => {
              throw 456
            })
            .catch((value) => {
              expect(value).to.equal(456)
              done()
            })
        })
      })

      describe('When onFulfilled returns an already fulfilled promise', () => {
        it("returns promise which gets fulfilled with that promise's value as its value", (done) => {
          const p = Promise.resolve(200)

          Promise.resolve(123)
            .then((_) => p)
            .then((value) => {
              expect(value).to.equal(200)
              done()
            })
        })
      })

      describe('When onFulfilled returns an already rejected promise', () => {
        it("returns promise which gets rejected with that promise's value as its value", (done) => {
          const p = Promise.reject(200)

          Promise.resolve(123)
            .then((_) => p)
            .catch((value) => {
              expect(value).to.equal(200)
              done()
            })
        })
      })

      describe('When onFulfilled another pending promise object', () => {
        it("returns promise which follows the onFulfilled's return value and adopts its eventual state", (done) => {
          Promise.resolve(123)
            .then(
              (_) =>
                new Promise((resolve) => {
                  setTimeout(() => resolve(100), 0)
                }),
            )
            .then((value) => {
              expect(value).to.equal(100)

              Promise.resolve(246)
                .then(
                  (_) =>
                    new Promise((_resolve, reject) => {
                      setTimeout(() => reject(200), 0)
                    }),
                )
                .catch((reason) => {
                  expect(reason).to.equal(200)
                  done()
                })
            })
        })
      })
    })
  })

  describe('When promise rejects', () => {
    describe('When onRejected is not a function', () => {
      it("returns promise which is rejected with the original promise's value as its value", (done) => {
        Promise.reject(123)
          .then()
          .catch((reason) => {
            expect(reason).to.equal(123)
            done()
          })
      })
    })

    describe('When onRejected is a function', () => {
      describe('When onRejected returns a value', () => {
        it("returns promise which is fulfilled with onRejected's return value as its value", (done) => {
          Promise.reject(123)
            .then(undefined, (reason) => reason * 2)
            .then((value) => {
              expect(value).to.equal(246)
              done()
            })
        })
      })

      describe('When onRejected does not return anything', () => {
        it('returns promise which is fulfilled with undefined as its value', (done) => {
          Promise.reject(123)
            .then(undefined, (_) => {})
            .then((value) => {
              expect(value).to.equal(undefined)
              done()
            })
        })
      })

      describe('When onRejected throws an error', () => {
        it('returns promise which gets rejected with the thrown error as its value', (done) => {
          Promise.reject(123)
            .then(undefined, (_) => {
              throw 456
            })
            .catch((value) => {
              expect(value).to.equal(456)
              done()
            })
        })
      })

      describe('When onRejected returns an already fulfilled promise', () => {
        it("returns promise which gets fulfilled with that promise's value as its value", (done) => {
          const p = Promise.resolve(200)

          Promise.reject(123)
            .then(undefined, (_) => p)
            .then((value) => {
              expect(value).to.equal(200)
              done()
            })
        })
      })

      describe('When onRejected returns an already rejected promise', () => {
        it("returns promise which gets rejected with that promise's value as its value", (done) => {
          const p = Promise.reject(200)

          Promise.reject(123)
            .then(undefined, (_) => p)
            .catch((value) => {
              expect(value).to.equal(200)
              done()
            })
        })
      })

      describe('When onRejected another pending promise object', () => {
        it("returns promise which follows the onRejected's return value and adopts its eventual state", (done) => {
          Promise.reject(123)
            .then(
              undefined,
              (_) =>
                new Promise((resolve) => {
                  setTimeout(() => resolve(100), 0)
                }),
            )
            .then((value) => {
              expect(value).to.equal(100)

              Promise.reject(246)
                .then(
                  undefined,
                  (_) =>
                    new Promise((_resolve, reject) => {
                      setTimeout(() => reject(200), 0)
                    }),
                )
                .catch((reason) => {
                  expect(reason).to.equal(200)
                  done()
                })
            })
        })
      })
    })
  })
})

describe('Promise.prototype.catch(onRejected)', () => {
  describe('When promise resolves', () => {
    it("returns promise which is fulfilled with the original promise's value as its value", (done) => {
      const callback = createSpy()

      Promise.resolve(100)
        .catch((_reason) => callback())
        .then((value) => {
          expect(value).to.equal(100)
          expect(callback.callCount).to.equal(0)
          done()
        })
    })
  })

  describe('When promise rejects', () => {
    it("returns a promise which is fulfilled with onRejected's return value", (done) => {
      Promise.reject(123)
        .catch((reason) => {
          return reason * 2
        })
        .then((value) => {
          expect(value).to.equal(246)
          done()
        })
    })

    it("returns a promise which is fulfilled with onRejected's return value when the value is a promise", (done) => {
      Promise.reject(123)
        .catch((reason) => {
          return Promise.resolve(reason * 2)
        })
        .then((value) => {
          expect(value).to.equal(246)
          done()
        })
    })

    it('rejects when onRejected throws a value', (done) => {
      Promise.reject(123)
        .catch((reason) => {
          throw reason * 2
        })
        .catch((value) => {
          expect(value).to.equal(246)
          done()
        })
    })

    it('rejects when onRejected returns a promise which is itself rejected', (done) => {
      Promise.reject(123)
        .catch((reason) => {
          return Promise.reject(reason * 2)
        })
        .catch((value) => {
          expect(value).to.equal(246)
          done()
        })
    })
  })
})

describe('Promise.prototype.finally(onFinally)', () => {
  describe('When promise resolves', () => {
    it("returns promise which is fulfilled with the original promise's value as its value and executes onFinally", (done) => {
      const callback = createSpy()

      Promise.resolve(100)
        .finally(() => {
          callback()
        })
        .then((value) => {
          expect(value).to.equal(100)
          expect(callback.callCount).to.equal(1)
          done()
        })
    })

    it('rejects returned promise when onFinally throws any value', (done) => {
      Promise.resolve(100)
        .finally(() => {
          throw 'finally-reason'
        })
        .catch((reason) => {
          expect(reason).to.equal('finally-reason')
          done()
        })
    })

    describe('When onFinally returns a promise', () => {
      it("returns promise which adopts original promise's eventual state when onFinally returns fulfilled promise", (done) => {
        Promise.resolve(100)
          .finally(() => Promise.resolve('finally-value'))
          .then((value) => {
            expect(value).to.equal(100)
            done()
          })
      })

      it('rejects returned promise when onFinally returns rejected promise', (done) => {
        Promise.resolve(100)
          .finally(() => Promise.reject('finally-reason'))
          .catch((reason) => {
            expect(reason).to.equal('finally-reason')
            done()
          })
      })
    })
  })

  describe('When promise rejects', () => {
    it("returns promise which is rejected with the original promise's reason as its value and executes onFinally", (done) => {
      const callback = createSpy()

      Promise.reject(100)
        .finally(() => {
          callback()
        })
        .catch((value) => {
          expect(value).to.equal(100)
          expect(callback.callCount).to.equal(1)
          done()
        })
    })

    it('rejects returned promise when onFinally throws any value', (done) => {
      Promise.reject(100)
        .finally(() => {
          throw 'finally-reason'
        })
        .catch((reason) => {
          expect(reason).to.equal('finally-reason')
          done()
        })
    })

    describe('When onFinally returns a promise', () => {
      it("returns promise which adopts original promise's eventual state when onFinally returns fulfilled promise", (done) => {
        Promise.reject(100)
          .finally(() => Promise.resolve('finally-value'))
          .catch((value) => {
            expect(value).to.equal(100)
            done()
          })
      })

      it('rejects returned promise when onFinally returns rejected promise', (done) => {
        Promise.reject(100)
          .finally(() => Promise.reject('finally-reason'))
          .catch((reason) => {
            expect(reason).to.equal('finally-reason')
            done()
          })
      })
    })
  })
})

describe('Promise.resolve(value)', () => {
  describe('When the value passed is thenable', () => {
    it('returns a promise which follows the thenable and adopts its eventual state', (done) => {
      Promise.resolve(Promise.resolve('hello')).then((value) => {
        expect(value).to.equal('hello')
        done()
      })
    })
  })

  describe('When the value passed is not thenable', () => {
    it('returns a promise which is fulfilled with the value', (done) => {
      Promise.resolve('hello').then((value) => {
        expect(value).to.equal('hello')
        done()
      })
    })
  })
})

describe('Promise.reject(reason)', () => {
  it('returns a promise that is rejected with the reason', (done) => {
    Promise.reject('hello').catch((reason) => {
      expect(reason).to.equal('hello')
      done()
    })
  })
})

describe('Promise.all(iterable)', () => {
  describe('When the iterable passed is empty', () => {
    it('returns a promise that resolves to an empty array', (done) => {
      Promise.all([]).then((value) => {
        expect(value).to.deep.equal([])
        done()
      })
    })
  })

  describe('When the iterable passed is not empty', () => {
    it('returns a Promise that resolves to an array of the results of the input promises', (done) => {
      Promise.all([
        Promise.resolve(123),
        Promise.resolve(456),
        Promise.resolve(789),
        msleep(0).then(() => 1000),
      ]).then((value) => {
        expect(value).to.deep.equal([123, 456, 789, 1000])
        done()
      })
    })

    it('rejects immediately upon any of the input promises rejecting, and will reject with this first rejection reason', (done) => {
      Promise.all([
        Promise.resolve(123),
        Promise.resolve(456),
        Promise.reject(789),
        msleep(0).then(() => 1000),
      ]).catch((value) => {
        expect(value).to.equal(789)
        done()
      })
    })
  })
})

describe('Chaining test', () => {
  it('should pass value through promise chain', (done) => {
    Promise.resolve(10)
      .then((value) => value * 2)
      .then((value) => value + 5)
      .then((value) => {
        expect(value).to.equal(25)
        done()
      })
  })

  it('should pass rejection reason through promise chain', (done) => {
    Promise.reject(10)
      .then((value) => value * 2)
      .then((value) => value + 5)
      .catch((value) => {
        expect(value).to.equal(10)
        done()
      })
  })
})

function msleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
