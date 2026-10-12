// Parses and replaces req.body with the validated (and stripped) result.
export const validateBody = (schema) => (req, _res, next) => {
  req.body = schema.parse(req.body);
  next();
};
