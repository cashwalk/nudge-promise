exports.createSpy = () => {
  const result = () => {
    result.callCount += 1
  }

  result.callCount = 0

  return result
}
