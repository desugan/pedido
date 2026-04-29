const paginatedResponse = (data, total, req) => {
  if (!req.pagination?.isPaginated) {
    return data;
  }

  const { page, limit } = req.pagination;
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};

module.exports = { paginatedResponse };