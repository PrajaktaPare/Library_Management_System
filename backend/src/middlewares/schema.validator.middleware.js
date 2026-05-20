import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import ajvErrors from 'ajv-errors';
import logger from '../services/logger.service.js';

// create AJV validator instance with global settings
const ajv = new Ajv({
  allErrors: true, // return all validation errors
  coerceTypes: true, // convert values like "46" -> 46
});

// add support for formats like email, date, uri, uuid, etc.
addFormats(ajv);

// enable custom validation error messages
ajvErrors(ajv);

// store compiled schemas in memory for better performance
const schemaCache = new Map();

// reusable middleware for request validation
export const validateSchema = (schema, source = 'body') => {
  let validate;

  // reuse schema if already compiled
  if (schemaCache.has(schema)) {
    validate = schemaCache.get(schema);
  } else {
    // compile schema and cache it
    validate = ajv.compile(schema);
    schemaCache.set(schema, validate);
  }

  return (req, res, next) => {
    try {
      // get data from req.body / req.params / req.query
      let data = req[source];

      // prevent validation crash if data is undefined
      if (!data) {
        data = {};
      }

      // validate incoming request data
      const valid = validate(data);

      // return validation errors if request is invalid
      if (!valid) {
        logger.warn('AJV VALIDATION FAILED', validate.errors);

        return res.status(400).json({
          success: false,
          errors: validate.errors.map(err => ({
            field: err.instancePath || source,
            message: err.message,
          })),
        });
      }

      // continue to next middleware/controller
      next();
    } catch (error) {
      // log unexpected middleware errors
      logger.error('VALIDATION MIDDLEWARE ERROR', error);

      return res.status(500).json({
        success: false,
        message: 'VALIDATION_MIDDLEWARE_ERROR',
      });
    }
  };
};
