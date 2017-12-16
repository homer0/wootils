const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((presolve, preject) => {
    resolve = presolve;
    reject = preject;
  });

  return {
    promise,
    resolve,
    reject,
  };
};

module.exports = deferred;
