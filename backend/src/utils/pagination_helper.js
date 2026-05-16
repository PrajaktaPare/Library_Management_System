class PaginationHelper {
  static getPaginationParams(query, defaultLimit = 10, maxLimit = 100) {
    let page = parseInt(query.page) || 1;
    let limit = parseInt(query.limit) || defaultLimit;

    if (page < 1) page = 1;
    if (limit < 1) limit = defaultLimit;
    if (limit > maxLimit) limit = maxLimit;

    const offset = (page - 1) * limit;

    return {
      page,
      limit,
      offset
    };
  }

  static getSortParams(query, defaultSort = 'created_at', defaultOrder = 'DESC') {
    const sortBy = query.sortBy || defaultSort;
    const order = (query.order || defaultOrder).toUpperCase();

    if (!['ASC', 'DESC'].includes(order)) {
      return {
        sortBy: defaultSort,
        order: defaultOrder
      };
    }

    return { sortBy, order };
  }

  static getSearchParams(query) {
    return {
      search: query.search || '',
      searchFields: query.searchFields ? query.searchFields.split(',') : []
    };
  }
}

export default PaginationHelper;
