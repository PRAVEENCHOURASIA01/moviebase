/**
 * Debounce a function call.
 * @param {Function} fn
 * @param {number} delay - ms
 * @returns {Function}
 */
export const debounce = (fn, delay) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}