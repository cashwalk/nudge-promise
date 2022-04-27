/*
 * Yet another Promise implementation
 *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 */

class Promise {
  #promise
  state = 'pending'

  /*
   * Promise.all
   *
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
   */
  static all(iterable) {
    return iterable.map((v) => new Promise((resolve, reject) => resolve(v)))
  }

  /*
   * Promise.resolve
   *
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve
   */
  static resolve(value) {
    return new Promise((resolve, reject) => resolve(value))
  }

  /*
   * Promise.reject
   *
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/reject
   */
  static reject(reason) {
    return new Promise((resolve, reject) => reject(reason))
  }

  /*
   * Promise() constructor
   *
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise
   */
  constructor(executor) {
    // handle TypeError
    if (executor === undefined)
      throw new TypeError('Promise resolver undefined is not a function')
    if (typeof executor !== 'function')
      throw new TypeError(`Promise resolver ${executor} is not a function`)

    // set resolutionFunc and rejectFunc
    this.resolutionFunc = (value) => {
      queueMicrotask(() => {
        if (this.state === 'pending') {
          this.state = 'fulfilled'
          this.value = value
        }
      })
    }
    this.rejectFunc = (reason) => {
      queueMicrotask(() => {
        if (this.state === 'pending') {
          this.state = 'rejected'
          this.value = reason
        }
      })
    }

    // call executor
    executor(this.resolutionFunc, this.rejectFunc)
  }

  /*
   * Promise.prototype.then
   *
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then
   */
  then(onFulfilled, onRejected) {
    // replace internally onFultilled and onRejected
    if (typeof onFulfilled !== 'function') {
      onFulfilled = (value) => value
    }
    if (typeof onRejected !== 'function') {
      onRejected = (reason) => {
        throw new Error(reason)
      }
    }

    // queue onFulfilled and onRejected callbacks
    queueMicrotask(() => {
      switch (this.state) {
        case 'fulfilled':
          try {
            const fulfilledValue = onFulfilled(this.value)

            // handle when onFulfilled returns instance of Promise
            if (fulfilledValue instanceof Promise) {
              switch (fulfilledValue.state) {
                case 'pending':
                  while (fulfilledValue.state === 'pending') {}
                case 'fulfilled':
                  this.value = fulfilledValue.value
                  break
                case 'rejected':
                  this.value = fulfilledValue.value
                  this.state = 'rejected'
                  break
              }
            } else {
              this.value = fulfilledValue
            }
            // handle onFulfilled throws an error
          } catch (e) {
            this.value = e
            this.state = 'rejected'
          }
          break
        case 'rejected':
          this.value = onRejected(this.value)
          break
      }
    })

    return this
  }

  /*
   * Promise.prototype.catch
   *
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch
   */
  catch(onRejected) {
    this.then(() => {}, onRejected)
  }

  /*
   * Promise.prototype.finally
   *
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/finally
   */
  finally(onFinally) {
    throw new Error('Not implemented yet')
  }
}

module.exports = Promise
