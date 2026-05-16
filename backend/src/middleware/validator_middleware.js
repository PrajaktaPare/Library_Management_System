import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import ajvErrors from 'ajv-errors';
import logger from '../utils/logger.js';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
ajvErrors(ajv);

const schemaCache = new Map();

/* =========================================
   HELPER: getValidator
   Compiles schema once, caches it
========================================= */
const getValidator = schema => {

  if (schemaCache.has(schema)) {
    return schemaCache.get(schema);
  }

  const validateFn = ajv.compile(schema);
  schemaCache.set(schema, validateFn);
  return validateFn;
};

/* =========================================
   HELPER: formatErrors
   Cleans up AJV error array into
   { field, message } pairs
========================================= */
const formatErrors = errors =>
  errors.map(err => ({
    field: err.instancePath.replace(/^\//, '') || 'body',
    message: err.message,
  }));

/* =========================================
   MIDDLEWARE: validateJson
   Validates req.body against a JSON schema.

   Usage:
   router.post('/register', validateJson(registerValidator), register);
========================================= */
export const validateJson = schema => {

  const validateFn = getValidator(schema);

  return (req, res, next) => {

    const valid = validateFn(req.body);

    if (!valid) {

      logger.warn(
        'BODY VALIDATION FAILED',
        validateFn.errors
      );

      return res.status(400).json({
        success_flag: false,
        message: 'VALIDATION_ERROR',
        errors: formatErrors(validateFn.errors),
      });
    }

    next();
  };
};

/* =========================================
   MIDDLEWARE: validateParams
   Validates req.params against a JSON schema.
   Used for /:id routes where the param comes
   from the URL, not the request body.

   Usage:
   router.get('/:id', validateParams(userIdValidator), getUserByID);
========================================= */
export const validateParams = schema => {

  const validateFn = getValidator(schema);

  return (req, res, next) => {

    const valid = validateFn(req.params);

    if (!valid) {

      logger.warn(
        'PARAMS VALIDATION FAILED',
        validateFn.errors
      );

      return res.status(400).json({
        success_flag: false,
        message: 'VALIDATION_ERROR',
        errors: formatErrors(validateFn.errors),
      });
    }

    next();
  };
};