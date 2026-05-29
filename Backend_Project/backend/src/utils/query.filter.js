

export const buildFilterQuery = ({ query, baseSql, tableAlias = '' }) => {
  // DEFAULT FILTER
  let filter = {};

  // PARSE FILTER
  if (query.filter) {
    try {
      filter = JSON.parse(query.filter);
    } catch (error) {
      const err = new Error('INVALID_FILTER_FORMAT');

      err.statusCode = 400;

      throw err;
    }
  }

  // EXTRACT FILTER OPTIONS
  const { limit = 10, offset = 0, order = 'id ASC', where = {} } = filter;

  // FINAL SQL
  let sql = baseSql;

  // STORE VALUES
  const values = [];

  // STORE CONDITIONS
  const conditions = [];

  // PREFIX
  const prefix = tableAlias ? `${tableAlias}.` : '';

  // BUILD WHERE CONDITIONS
  for (const [key, condition] of Object.entries(where)) {
    // NORMAL EQUAL CONDITION
    if (typeof condition !== 'object' || condition === null) {
      conditions.push(`${prefix}${key} = ?`);
      values.push(condition);

      continue;
    }

    // LIKE CONDITION
    if (condition.like !== undefined) {
      conditions.push(`${prefix}${key} LIKE ?`);
      values.push(`%${condition.like}%`);

      continue;
    }

    // INVALID FILTER
    const error = new Error(`INVALID_FILTER_FOR_${key.toUpperCase()}`);

    error.statusCode = 400;

    throw error;
  }

  // APPEND WHERE
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }

  // APPEND ORDER
  sql += ` ORDER BY ${prefix}${order}`;

  // APPEND PAGINATION
  sql += ` LIMIT ? OFFSET ?`;

  // PUSH PAGINATION VALUES
  values.push(Number(limit) || 10);
  values.push(Number(offset) || 0);

  // LOGS
  console.log('SQL : ', sql);
  console.log('Values : ', values);

  return {
    sql,
    values,
  };
};