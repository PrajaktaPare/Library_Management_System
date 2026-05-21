import db from '../config/db.js';
import logger from '../services/logger.service.js';

//Book create 
export const createBook = async (req, res) => {
  try {
    const {
      title,
      author,
      book_num,
      category,
      sub_category = null,
      total_copies = 0,
      available_copies = 0,
      status = 'unavailable',
    } = req.body;

    const [result] = await db.execute(
      `INSERT INTO books (title, author, book_num, category, sub_category, total_copies, available_copies, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, author, book_num, category, sub_category, total_copies, available_copies, status]
    );

    return res.status(201).json({
      success_flag: true,
      message: 'BOOK_CREATED',
      data: { book_id: result.insertId },
    });

  } catch (error) {
    logger.error(error);

    return res.status(error.code === 'ER_DUP_ENTRY' ? 409 : 500).json({
      success_flag: false,
      message: error.code === 'ER_DUP_ENTRY'
        ? 'BOOK_NUM_ALREADY_EXISTS'
        : error.message || 'INTERNAL_SERVER_ERROR',
    });
  }
};


// GET ALL BOOKS (FILTER + SORT + PAGINATION)
export const getAllBooks = async (req, res) => {
  try {
    let filter = {};

    if (req.query.filter) {
      try {
        filter = JSON.parse(req.query.filter);
      } catch (error) {
        return res.status(400).json({
          success_flag: false,
          message: 'INVALID_FILTER_FORMAT',
          error: error.message,
        });
      }
    }

    const { limit = 10, offset = 0, order = {}, where = {} } = filter;

    let sql = `SELECT * FROM books`;

    const values = [];
    const conditions = [];

    // WHERE CONDITIONS
    for (const [key, condition] of Object.entries(where)) {

      // DEFAULT EQ
      if (typeof condition !== 'object' || condition === null) {
        conditions.push(`${key} = ?`);
        values.push(condition);
        continue;
      }
      
      // LIKE
      if (condition.like !== undefined) {
        conditions.push(`${key} LIKE ?`);
        values.push(`%${condition.like}%`);
        continue;
      }

      return res.status(400).json({
        success_flag: false,
        message: `INVALID_FILTER_FOR_${key.toUpperCase()}`,
      });
    }

    // ADD WHERE
    if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`;

    // SORTING
    let orderColumn = order?.column || 'id';

    const orderDirection = order?.direction?.toUpperCase() === 'DESC'
      ? 'DESC'
      : 'ASC';

    sql += ` ORDER BY ${orderColumn} ${orderDirection}`;

    // PAGINATION
    sql += ` LIMIT ? OFFSET ?`;

    values.push(Number(limit) || 10, Number(offset) || 0);

    // EXECUTE QUERY
    const [rows] = await db.query(sql, values);

    // NO DATA FOUND
    if (rows.length === 0) {
      const filterKeys = Object.keys(where);

      throw new Error(
        filterKeys.length > 0
          ? `${filterKeys.map(key => key.toUpperCase()).join('_')}_NOT_FOUND`
          : 'BOOK_NOT_FOUND'
      );
    }

    return res.status(200).json({
      success_flag: true,
      message: 'BOOKS_FETCHED_SUCCESSFULLY',
      data: rows,
    });
        } catch (error) {
    logger.error(error);

    return res.status(error.message?.includes('NOT_FOUND') ? 404 : 500).json({
      success_flag: false,
      message: error.message?.includes('NOT_FOUND')
        ? error.message
        : 'INTERNAL_SERVER_ERROR',
      ...(error.message?.includes('NOT_FOUND') ? {} : { error: error.message }),
    });
  }
};

//GET BOOK BY ID
export const getBookById = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM books WHERE id=?`,
      [req.params.id]
    );

    if (!rows.length) throw new Error('BOOK_NOT_FOUND');

    return res.status(200).json({
      success_flag: true,
      data: rows[0],
    });

  } catch (error) {
    logger.error(error);

    return res.status(error.message === 'BOOK_NOT_FOUND' ? 404 : 500).json({
      success_flag: false,
      message: error.message === 'BOOK_NOT_FOUND'
        ? error.message
        : 'INTERNAL_SERVER_ERROR',
    });
  }
};

//PATCH BOOK (PARTIAL UPDATE)
export const patchBook = async (req, res) => {
  try {
    const { id } = req.params;

    if (!Object.keys(req.body).length) {
      return res.status(400).json({
        success_flag: false,
        message: 'NO_DATA_TO_UPDATE',
      });
    }

    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(req.body)) {
      fields.push(`${key}=?`);
      values.push(value);
    }
    values.push(id);
    await db.execute(
      `UPDATE books SET ${fields.join(', ')} WHERE id=?`,
      values
    );

    return res.status(200).json({
      success_flag: true,
      message: 'BOOK_UPDATED',
    });

  } catch (error) {
    logger.error(error);

    return res.status(500).json({
      success_flag: false,
      message: 'ERROR',
    });
  }
};


//DELETE BOOK
export const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.execute(
      `SELECT id FROM books WHERE id=?`,
      [id]
    );

    if (!rows.length) throw new Error('BOOK_NOT_FOUND');

    await db.execute(`DELETE FROM books WHERE id=?`, [id]);

    return res.status(200).json({
      success_flag: true,
      message: 'BOOK_DELETED',
    });

  } catch (error) {
    logger.error(error);

    return res.status(error.message === 'BOOK_NOT_FOUND' ? 404 : 500).json({
      success_flag: false,
      message: error.message === 'BOOK_NOT_FOUND'
        ? error.message
        : 'INTERNAL_SERVER_ERROR',
    });
  }
};