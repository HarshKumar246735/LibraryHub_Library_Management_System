export const sendSuccess = (res, { status = 200, message = 'OK', data = null, pagination } = {}) => {
  const body = { success: true, message, data };
  if (pagination) body.pagination = pagination;
  return res.status(status).json(body);
};

export const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
