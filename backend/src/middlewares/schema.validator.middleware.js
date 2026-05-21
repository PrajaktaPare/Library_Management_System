import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import ajvErrors from 'ajv-errors';
import logger from '../services/logger.service.js';

const ajv = new Ajv({
  allErrors: true,
  coerceTypes: true,
  useDefaults: true,
  strict: false,
});

addFormats(ajv);
ajvErrors(ajv);

const schemaCache = new Map();

export const validateSchema = (schema, source = 'body') => {
  let validate;

  if (schemaCache.has(schema)) {
    validate = schemaCache.get(schema);
  } else {
    validate = ajv.compile(schema);
    schemaCache.set(schema, validate);
  }

  return (req, res, next) => {
    try {
      const data = req[source] ?? {};

      const valid = validate(data);

      if (!valid) {
        logger.warn('AJV VALIDATION FAILED', validate.errors);

        const errors = validate.errors.map(err => {
          return {
            field: getFieldName(err),
            message: err.message,
          };
        });

        return res.status(400).json({
          success: false,
          message: errors[0]?.message || 'VALIDATION_ERROR',
          errors,
        });
      }

      next();
    } catch (error) {
      logger.error('VALIDATION MIDDLEWARE ERROR', error);

      return res.status(500).json({
        success: false,
        message: 'VALIDATION_MIDDLEWARE_ERROR',
      });
    }
  };
};

function getFieldName(err) {
  // query param / body field name
  if (err.instancePath) {
    return err.instancePath.replace('/', '');
  }

  // missing required field
  if (err.params?.missingProperty) {
    return err.params.missingProperty;
  }

  // extra field
  if (err.params?.additionalProperty) {
    return err.params.additionalProperty;
  }

  return 'unknown_field';
}
