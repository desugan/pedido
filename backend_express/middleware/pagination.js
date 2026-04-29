const pagination = (defaultLimit = 50, maxLimit = 100) => {
  return (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || defaultLimit, maxLimit);
    const skip = (page - 1) * limit;

    req.pagination = {
      page,
      limit,
      skip,
      isPaginated: req.query.page !== undefined || req.query.limit !== undefined
    };

    next();
  };
};

module.exports = pagination;