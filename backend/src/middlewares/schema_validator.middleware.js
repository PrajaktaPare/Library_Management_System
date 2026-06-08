import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import ajvErrors from 'ajv-errors';
import logger from '../services/logger.service.js';

// create ajv instance
const ajv = new Ajv({
  allErrors: true, // return all validation errors
  coerceTypes: true, // auto convert data types
});

// add format validations
addFormats(ajv);

// add custom error support
ajvErrors(ajv);

// cache compiled schemas
const schemaCache = new Map();

// reusable validation middleware
export const validateSchema = (schema, source = 'body') => {
  // validator function
  let validate;

  // check schema cache
  if (schemaCache.has(schema)) {
    validate = schemaCache.get(schema);
  } else {
    // compile schema
    validate = ajv.compile(schema);

    // store compiled schema
    schemaCache.set(schema, validate);
  }

  // middleware function
  return (req, res, next) => {
    try {
      // get request data
      const data = req[source] ?? {};

      // validate data
      const valid = validate(data);

      // validation failed
      if (!valid) {
        logger.warn('AJV VALIDATION FAILED', validate.errors);

        // format errors
        const errors = validate.errors.map(err => {
          return {
            field: getFieldName(err),
            message: err.message,
          };
        });

        // return validation response
        return res.status(400).json({
          success_flag: false,
          message: errors[0]?.message || 'Validation error',
          errors,
        });
      }

      // continue request
      next();
    } catch (error) {
      // log middleware error
      logger.error('VALIDATION MIDDLEWARE ERROR', error);

      // return error response
      return res.status(500).json({
        success_flag: false,
        message: 'Validation middleware error',
      });
    }
  };
};

// extract field name from ajv error
function getFieldName(err) {
  // body/query field
  if (err.instancePath) {
    return err.instancePath.replace('/', '');
  }

  // required field missing
  if (err.params?.missingProperty) {
    return err.params.missingProperty;
  }

  // extra field found
  if (err.params?.additionalProperty) {
    return err.params.additionalProperty;
  }

  // fallback field
  return 'unknown_field';
}
