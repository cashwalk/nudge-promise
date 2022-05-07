class Promise {
  #promise
  #value
  #state = 'pending'

  static all(iterable) {
    // initiate new promise with pending state
    this.promise = Promise.resolve()
    this.promise.state = 'pending'

    queueMicrotask(() => this.promiseAllMicrotask(iterable))

    return this.promise
  }

  static promiseAllMicrotask(iterable) {
    // if some promise not resolved yet enqueue on task queue
    if(!iterable.every(v => v.state !== 'pending')) {
      setTimeout(() => this.promiseAllMicrotask(iterable), 0)
      return
    }

    // reduce iterable for catching rejected promise
    const iterableResults = iterable.reduce((prev, cur) => {
      if(!Array.isArray(prev)) return prev

      return cur.state === 'fulfilled' ? prev.concat(cur.value) : cur.value
    }, [])

    // update state and value of this promise
    this.promise.callResolutionOrRejectFunc(
      () => Array.isArray(iterableResults) ? 'fulfilled' : 'rejected',
      () => iterableResults,
    )
  }

  static resolve(value) {
    return value instanceof Promise ? value : new Promise((resolve, reject) => resolve(value))
  }

  static reject(reason) {
    return new Promise((resolve, reject) => reject(reason))
  }

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

    // enqueue to emit unhandledRejection event on task queue
    setTimeout((promise = this) => {
      if(promise.state === 'rejected') {
        process.emit('unhandledRejection', promise.value, promise)
      }
    }, 0)
  }

  then(onFulfilled, onRejected) {
    // initiate new promise with pending state
    this.promise = Promise.resolve()
    this.promise.state = 'pending'

    // how enqueue microtask after all tasks when promise is pending state?
    // first. enqueue then method all process on microtask
    queueMicrotask(() => this.thenQueueMicrotask(onFulfilled, onRejected))

    return this.promise
  }

  callResolutionOrRejectFunc(typeGetter, getter) {
    typeGetter() === 'fulfilled'
      ? this.resolutionFunc(getter())
      : this.rejectFunc(getter())
  }

  thenQueueMicrotask(onFulfilled, onRejected) {
    let newPromiseState = 'fulfilled'

    // replace internally onFultilled and onRejected
    if (typeof onFulfilled !== 'function') {
      onFulfilled = (value) => value
    }
    if (typeof onRejected !== 'function') {
      if(this.state === 'rejected') newPromiseState = 'rejected'
      onRejected = (reason) => reason
    }

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
                    () => fulfilledOrRejectedValue.state,
                    () => fulfilledOrRejectedValue.value,
                  ),0
                )
                break

              case 'fulfilled':
              case 'rejected':
                this.promise.callResolutionOrRejectFunc(
                  () => fulfilledOrRejectedValue.state,
                  () => fulfilledOrRejectedValue.value,
                )
                break
            }
            // when fulfilled return value is not a promise
          } else {
            this.promise.callResolutionOrRejectFunc(
              () => newPromiseState,
              () => fulfilledOrRejectedValue,
            )
          }
          // if fulfilled value throw error
        } catch (e) {
          fulfilledOrRejectedValue = e
          this.promise.callResolutionOrRejectFunc(
            () => 'rejected',
            () => fulfilledOrRejectedValue,
          )
        }
        break
    }
  }



  /*
   * Promise.prototype.catch
   *
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch
   */
  catch(onRejected) {
    return this.then(undefined, onRejected)
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
    // initiate new promise with pending state
    this.promise = Promise.resolve()
    this.promise.state = 'pending'

    queueMicrotask(() => this.finallyQueueMicrotask(onFinally))

    return this.promise
  }

  finallyQueueMicrotask(onFinally) {
    let finallyCallbackValue
    switch (this.state) {
      case 'fulfilled':
      case 'rejected':
        try {
          finallyCallbackValue = onFinally()

          // when onFinally callback returns Promise
          if (finallyCallbackValue instanceof Promise) {
            switch (finallyCallbackValue.state) {
              case 'fulfilled':
                this.promise.callResolutionOrRejectFunc(
                  () => this.state,
                  () => this.value,
                )
                break
              case 'rejected':
                this.promise.callResolutionOrRejectFunc(
                  () => finallyCallbackValue.state,
                  () => finallyCallbackValue.value,
                )
                break
            }
            // when onFinally callback returns not a Promise, return original value
          } else {
            this.promise.callResolutionOrRejectFunc(
              () => this.state,
              () => this.value,
            )
          }
          // if callback value throw error
        } catch (e) {
          finallyCallbackValue = e
          this.promise.callResolutionOrRejectFunc(
            () => 'rejected',
            () => finallyCallbackValue,
          )
        }
        break
    }
  }
}

module.exports = Promise
