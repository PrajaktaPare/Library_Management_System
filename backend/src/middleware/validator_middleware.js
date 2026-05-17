import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import ajvErrors from 'ajv-errors';

import logger from '../utils/logger.js';

// Create AJV instance
const ajv = new Ajv({
  allErrors: true,
});

// Add format validations
addFormats(ajv);

// Enable custom error messages
ajvErrors(ajv);

// Cache compiled schemas
const schemaCache = new Map();

/* =========================================
   FUNCTION: getValidator

   PURPOSE:
   Compile schema once and cache it
   for better performance

   PARAMETER:
   - schema

   RETURN:
   - compiled validator function
========================================= */
const getValidator = schema => {
  // Return cached validator if exists
  if (schemaCache.has(schema)) {
    return schemaCache.get(schema);
  }

  // Compile schema
  const validateFn = ajv.compile(schema);

  // Store in cache
  schemaCache.set(schema, validateFn);

  return validateFn;
};

/* =========================================
   FUNCTION: formatErrors

   PURPOSE:
   Format AJV validation errors into
   clean field-message objects

   PARAMETER:
   - errors

   RETURN:
   - formatted error array
========================================= */
const formatErrors = errors =>
  errors.map(err => ({
    field: err.instancePath.replace(/^\//, '') || 'body',

    message: err.message,
  }));

/* =========================================
   FUNCTION: validateJson

   PURPOSE:
   Validate req.body using JSON schema

   PARAMETER:
   - schema

   RETURN:
   - middleware function
========================================= */
export const validateJson = schema => {
  // Get compiled validator
  const validateFn = getValidator(schema);

  return (req, res, next) => {
    // Validate request body
    const valid = validateFn(req.body);

    // Validation failed
    if (!valid) {
      logger.warn('BODY VALIDATION FAILED', validateFn.errors);

      return res.status(400).json({
        success_flag: false,
        message: 'VALIDATION_ERROR',

        errors: formatErrors(validateFn.errors),
      });
    }

    // Continue to next middleware
    next();
  };
};

/* =========================================
   FUNCTION: validateParams

   PURPOSE:
   Validate req.params using JSON schema

   PARAMETER:
   - schema

   RETURN:
   - middleware function
========================================= */
export const validateParams = schema => {
  // Get compiled validator
  const validateFn = getValidator(schema);

  return (req, res, next) => {
    // Validate request params
    const valid = validateFn(req.params);

    // Validation failed
    if (!valid) {
      logger.warn('PARAMS VALIDATION FAILED', validateFn.errors);

      return res.status(400).json({
        success_flag: false,
        message: 'VALIDATION_ERROR',

        errors: formatErrors(validateFn.errors),
      });
    }

    // Continue to next middleware
    next();
  };
};
