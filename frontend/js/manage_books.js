/* ============================================================
   manage_books.js — admin book CRUD with API connection
   handles: add, edit, delete, search, filter, and pagination
   ============================================================ */

// track the book being edited (null = adding new)
let editBookId = null;
// current page for admin book listing
let booksAdminCurrentPage = 1;
// number of books shown per page
const BOOKS_ADMIN_PER_PAGE = 10;

// render books table with data from API
function renderBooksTable(books, total) {
  const tbody = document.getElementById("booksTableBody");
  if (!tbody) return;

  // show empty state if no books found
  if (!books || books.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center">No Books Found</td></tr>`;
    renderBooksAdminPagination(0);
    return;
  }

  // build table rows from API data
  tbody.innerHTML = books.map(book => `
    <tr>
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${book.category}</td>
      <td>${book.sub_category || "—"}</td>
      <td>${book.isbn || "—"}</td>
      <td>${book.total_copies}</td>
      <td>${book.available_copies}</td>
      <td>
        <button class="btn btn-sm" onclick="editBook(${book.id})">Edit</button>
        <button class="btn btn-sm btn-secondary" onclick="deleteBook(${book.id})">Delete</button>
      </td>
    </tr>`).join("");

  // render pagination controls
  renderBooksAdminPagination(total);
}

// render pagination buttons
function renderBooksAdminPagination(total) {
  const el = document.getElementById("booksAdminPagination");
  if (!el) return;
  const totalPages = Math.ceil(total / BOOKS_ADMIN_PER_PAGE);
  // hide pagination if only 1 page
  if (totalPages <= 1) { el.innerHTML = ""; return; }

  let btns = `<button class="btn btn-sm" ${booksAdminCurrentPage === 1 ? "disabled" : ""} onclick="booksAdminChangePage(${booksAdminCurrentPage - 1})">Prev</button>`;
  for (let i = 1; i <= totalPages; i++) {
    btns += `<button class="btn btn-sm ${i === booksAdminCurrentPage ? "active" : ""}" onclick="booksAdminChangePage(${i})">${i}</button>`;
  }
  btns += `<button class="btn btn-sm" ${booksAdminCurrentPage === totalPages ? "disabled" : ""} onclick="booksAdminChangePage(${booksAdminCurrentPage + 1})">Next</button>`;
  el.innerHTML = btns;
}

// change page and reload books
function booksAdminChangePage(page) {
  booksAdminCurrentPage = page;
  filterBooks();
}

// delete a book via API
async function deleteBook(id) {
  if (!confirm("Are you sure you want to delete this book?")) return;
  try {
    // call delete endpoint
    await apiClient.deleteBook(id);
    showToast("book deleted successfully", "success");
    booksAdminCurrentPage = 1;
    // refresh the book list
    filterBooks();
  } catch (error) {
    showToast(error.message || "Failed to delete book", "error");
  }
}

// open the add/edit book modal
function openAddBookModal(isEdit = false) {
  if (!isEdit) {
    editBookId = null;
    document.getElementById("bookForm").reset();
    document.getElementById("modalTitle").textContent = "Add Book";
  }
  // show the modal
  document.getElementById("bookModal").style.display = "flex";
}

// close the modal and reset form
function closeBookModal() {
  document.getElementById("bookModal").style.display = "none";
  editBookId = null;
  document.getElementById("bookForm").reset();
}

// save book via API (handles both add and edit)
async function saveBook(e) {
  e.preventDefault();

  // read form values
  const title = document.getElementById("bookTitle").value.trim();
  const author = document.getElementById("bookAuthor").value.trim();
  const category = document.getElementById("bookCategory").value;
  const sub_category = document.getElementById("bookSubCategory").value;
  const isbn = document.getElementById("bookISBN").value.trim();
  const total_copies = parseInt(document.getElementById("bookCopies").value);

  // validate required fields
  if (!title || !author || !category || !isbn || !total_copies) {
    showToast("all fields are required", "error");
    return;
  }
  if (total_copies <= 0) {
    showToast("copies must be greater than 0", "error");
    return;
  }

  try {
    if (editBookId) {
      // update existing book via API
      await apiClient.updateBook(editBookId, { title, author, category, sub_category, isbn, total_copies });
      showToast("book updated successfully", "success");
    } else {
      // create new book via API
      await apiClient.createBook({ title, author, category, sub_category, isbn, total_copies, available_copies: total_copies });
      showToast("book added successfully", "success");
    }
    booksAdminCurrentPage = 1;
    // refresh the list and close the modal
    filterBooks();
    closeBookModal();
  } catch (error) {
    showToast(error.message || "Failed to save book", "error");
  }
}

// populate the edit modal with existing book data
async function editBook(id) {
  try {
    // fetch book details from API
    const res = await apiClient.getBookById(id);
    const book = res.data;
    if (!book) return;

    editBookId = id;
    // fill form fields with book data
    document.getElementById("bookTitle").value = book.title;
    document.getElementById("bookAuthor").value = book.author;
    document.getElementById("bookCategory").value = book.category;
    document.getElementById("bookSubCategory").value = book.sub_category || "";
    document.getElementById("bookISBN").value = book.isbn || "";
    document.getElementById("bookCopies").value = book.total_copies;
    document.getElementById("modalTitle").textContent = "Edit Book";
    document.getElementById("bookModal").style.display = "flex";
  } catch (error) {
    showToast("Failed to load book details", "error");
  }
}

// fetch and display books from API with current search/filter
async function filterBooks() {
  const searchText = (document.getElementById("searchInput")?.value || "").trim();
  const category = document.getElementById("categoryFilter")?.value || "";

  // build filters object for API
  const filters = {};
  if (searchText) filters.search = searchText;
  if (category) filters.category = category;

  try {
    // call books API with pagination and filters
    const res = await apiClient.getBooks(booksAdminCurrentPage, BOOKS_ADMIN_PER_PAGE, filters);
    renderBooksTable(res.data, res.meta ? res.meta.total : 0);
  } catch (error) {
    console.error("Failed to load books:", error);
    const tbody = document.getElementById("booksTableBody");
    if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="text-center">Failed to load books</td></tr>`;
  }
}

// clear search input and refresh
function clearBooksSearch() {
  const inp = document.getElementById("searchInput");
  if (inp) inp.value = "";
  const btn = document.getElementById("searchClear");
  if (btn) btn.style.display = "none";
  booksAdminCurrentPage = 1;
  filterBooks();
}

// handle search input keyup
function onBooksSearch() {
  booksAdminCurrentPage = 1;
  const val = document.getElementById("searchInput")?.value || "";
  const btn = document.getElementById("searchClear");
  if (btn) btn.style.display = val ? "inline-flex" : "none";
  filterBooks();
}

// clear category filter and refresh
function clearCategoryFilter() {
  const sel = document.getElementById("categoryFilter");
  if (sel) sel.value = "";
  const btn = document.getElementById("categoryFilterClear");
  if (btn) btn.style.display = "none";
  booksAdminCurrentPage = 1;
  filterBooks();
}

// handle category dropdown change
function onCategoryFilterChange() {
  booksAdminCurrentPage = 1;
  const val = document.getElementById("categoryFilter")?.value || "";
  const btn = document.getElementById("categoryFilterClear");
  if (btn) btn.style.display = val ? "inline-flex" : "none";
  filterBooks();
}

// initialize page: load books on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  filterBooks();
});