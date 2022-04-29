/*
 * Yet another Promise implementation
 *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 */

class Promise {
  #promise
  #value
  #state = 'pending'

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
      if (this.state === 'pending') {
        this.state = 'fulfilled'
        this.value = value
      }
    }
    this.rejectFunc = (reason) => {
      if (this.state === 'pending') {
        this.state = 'rejected'
        this.value = reason
      }
    }

    // call executor
    executor(this.resolutionFunc, this.rejectFunc)
  }

  /*
   * Promise.prototype.then
   *
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then
   */
  //////////////////////////// my first approach ///////////////////////////////
  // then(onFulfilled, onRejected) {
  //   // replace internally onFultilled and onRejected
  //   if (typeof onFulfilled !== 'function') {
  //     onFulfilled = (value) => value
  //   }
  //   if (typeof onRejected !== 'function') {
  //     onRejected = (reason) => {
  //       throw new Error(reason)
  //     }
  //   }

  //   // queue onFulfilled and onRejected callbacks
  //   queueMicrotask(() => {
  //     switch (this.state) {
  //       case 'fulfilled':
  //         try {
  //           const fulfilledValue = onFulfilled(this.value)

  //           // handle when onFulfilled returns instance of Promise
  //           if (fulfilledValue instanceof Promise) {
  //             switch (fulfilledValue.state) {
  //               case 'fulfilled':
  //                 this.value = fulfilledValue.value
  //                 break
  //               case 'rejected':
  //                 this.value = fulfilledValue.value
  //                 this.state = 'rejected'
  //                 break
  //             }
  //           } else {
  //             this.value = fulfilledValue
  //           }
  //           // handle onFulfilled throws an error
  //         } catch (e) {
  //           this.value = e
  //           this.state = 'rejected'
  //         }
  //         break
  //       case 'rejected':
  //         this.value = onRejected(this.value)
  //         break
  //     }
  //   })

  //   return this
  // }

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

    // initiate new promise with pending state
    this.promise = Promise.resolve()
    this.promise.state = 'pending'

    // how enqueue microtask after all tasks when promise is pending state?
    // first. enqueue then method all process on microtask
    queueMicrotask(() => this.thenQueueMicrotask(onFulfilled, onRejected))

    return this.promise
  }

  thenQueueMicrotask(onFulfilled, onRejected) {
    let fulfilledOrRejectedValue
    switch (this.state) {
      case 'pending':
        // if Promise is pending state enqueue task queue
        setTimeout(() => this.thenQueueMicrotask(onFulfilled, onRejected),0)
        break
      case 'fulfilled':
      case 'rejected':
        try {
          fulfilledOrRejectedValue = this.state === 'fulfilled' ? onFulfilled(this.value) : onRejected(this.value)

          // when fulfilledValue is Promise
          if (fulfilledOrRejectedValue instanceof Promise) {
            switch (fulfilledOrRejectedValue.state) {
              // if pending state, set new promise's state pending and enqueue task queue
              case 'pending':
                setTimeout(() =>
                  this.promise.callResolutionOrRejectFunc(
                    'fulfilled',
                    () => fulfilledOrRejectedValue.value,
                  ),0
                )
                break

              case 'fulfilled':
              case 'rejected':
                this.promise.callResolutionOrRejectFunc(
                  fulfilledOrRejectedValue.state,
                  () => fulfilledOrRejectedValue.value,
                )
                break
            }
            // when fulfilled return value is not a promise
          } else {
            this.promise.callResolutionOrRejectFunc(
              this.state,
              () => fulfilledOrRejectedValue,
            )
          }
          // if fulfilled value throw error
        } catch (e) {
          fulfilledOrRejectedValue = e
          this.promise.callResolutionOrRejectFunc(
            'rejected',
            () => fulfilledOrRejectedValue,
          )
        }
        break
    }
  }

  callResolutionOrRejectFunc(type, getter) {
    type === 'fulfilled'
      ? this.resolutionFunc(getter())
      : this.rejectFunc(getter())
  }

  /*
   * Promise.prototype.catch
   *
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch
   */
  catch(onRejected) {
    this.then(onRejected, onRejected)
  }

  get promise() {
    return this.#promise
  }

  set promise(promise) {
    this.#promise = promise
  }

  get state() {
    return this.#state
  }

  set state(state) {
    this.#state = state
  }

  get value() {
    return this.#value
  }

  set value(value) {
    this.#value = value
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
