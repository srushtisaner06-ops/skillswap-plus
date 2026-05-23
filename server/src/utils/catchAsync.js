/* ═══════════════════════════════════════════
   Async Error Wrapper
   Eliminates try/catch in every controller
   ═══════════════════════════════════════════ */

const catchAsync = (fn) => {
  return (req, res, next) => {
    const forwardError = typeof next === 'function'
      ? next
      : (err) => {
          throw err;
        };

    Promise.resolve(fn(req, res, forwardError)).catch(forwardError);
  };
};

module.exports = catchAsync;
