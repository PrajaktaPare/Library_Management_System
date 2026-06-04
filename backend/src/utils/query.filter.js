export const buildFilterQuery = ({ query, baseSql, tableAlias = '', includePagination = true }) => {
  let filter = {};

  if (query.filter) {
    try {
      filter = JSON.parse(query.filter);
    } catch (error) {
      const err = new Error('INVALID_FILTER_FORMAT');
      err.statusCode = 400;
      throw err;
    }
  }

  const { limit = 10, offset = 0, order = 'id ASC', where = {} } = filter;

  let sql = baseSql;
  const values = [];
  const conditions = [];

  const prefix = tableAlias ? `${tableAlias}.` : '';

  // build where conditions
  for (const [key, condition] of Object.entries(where)) {
    if (typeof condition !== 'object' || condition === null) {
      conditions.push(`${prefix}${key} = ?`);
      values.push(condition);
      continue;
    }

    if (condition.like !== undefined) {
      conditions.push(`${prefix}${key} LIKE ?`);
      values.push(`%${condition.like}%`);
      continue;
    }

    const error = new Error(`INVALID_FILTER_FOR_${key.toUpperCase()}`);
    error.statusCode = 400;
    throw error;
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }

  if (includePagination) {
    sql += ` ORDER BY ${prefix}${order}`;
    sql += ` LIMIT ? OFFSET ?`;

    values.push(Number(limit) || 10);
    values.push(Number(offset) || 0);
  }

  return {
    sql,
    values,
  };
};
