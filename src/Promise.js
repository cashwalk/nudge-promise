/*
 * Yet another Promise implementation
 *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 */

class Promise {
  /*
   * Promise.all
   *
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
   */
  static all(iterable) {
    throw new Error('Not implemented yet')
  }

  /*
   * Promise.resolve
   *
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve
   */
  static resolve(value) {
    throw new Error('Not implemented yet')
  }

  /*
   * Promise.reject
   *
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/reject
   */
  static reject(reason) {
    throw new Error('Not implemented yet')
  }

  /*
   * Promise() constructor
   *
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise
   */
  constructor(executor) {
    throw new Error('Not implemented yet')
  }

  /*
   * Promise.prototype.then
   *
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then
   */
  then(onFulfilled, onRejected) {
    throw new Error('Not implemented yet')
  }

  /*
   * Promise.prototype.catch
   *
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch
   */
  catch(onRejected) {
    throw new Error('Not implemented yet')
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
