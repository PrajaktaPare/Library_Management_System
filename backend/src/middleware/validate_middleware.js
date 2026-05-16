const validateMiddleware = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[source];
    const { error, value } = schema.validate(dataToValidate, { abortEarly: false, stripUnknown: true });
    if (error) {
      const details = error.details.map(detail => ({ field: detail.path.join('.'), message: detail.message, type: detail.type }));
      return res.status(422).json({ success: false, statusCode: 422, message: 'Validation error', errors: details, timestamp: new Date().toISOString() });
    }
    req[source] = value;
    next();
  };
};

export default validateMiddleware;
