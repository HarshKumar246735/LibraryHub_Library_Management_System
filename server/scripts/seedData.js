// Demo catalogue. ISBNs are used for Open Library cover URLs; the UI falls back to a placeholder if a cover fails.
const b = (title, author, isbn, category, year, publisher, copies, shelf) => ({ title, author, isbn, category, publicationYear: year, publisher, totalCopies: copies, shelfLocation: shelf, language: 'English' });

export const DEMO_BOOKS = [
  b('Clean Code', 'Robert C. Martin', '9780132350884', 'Programming', 2008, 'Prentice Hall', 4, 'A-01'),
  b('Design Patterns', 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', '9780201633610', 'Programming', 1994, 'Addison-Wesley', 3, 'A-02'),
  b('Introduction to Algorithms', 'Thomas H. Cormen et al.', '9780262033848', 'Computer Science', 2009, 'MIT Press', 5, 'A-03'),
  b('Eloquent JavaScript', 'Marijn Haverbeke', '9781593279509', 'Programming', 2018, 'No Starch Press', 3, 'A-04'),
  b('Python Crash Course', 'Eric Matthes', '9781593279288', 'Programming', 2019, 'No Starch Press', 4, 'A-05'),
  b('Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', '9780062316110', 'History', 2015, 'Harper', 3, 'B-01'),
  b('The Discovery of India', 'Jawaharlal Nehru', '9780143031031', 'History', 2004, 'Penguin India', 2, 'B-02'),
  b('A Brief History of Time', 'Stephen Hawking', '9780553380163', 'Science', 1998, 'Bantam', 3, 'C-01'),
  b('Cosmos', 'Carl Sagan', '9780345539434', 'Science', 2013, 'Ballantine Books', 2, 'C-02'),
  b('The Selfish Gene', 'Richard Dawkins', '9780198788607', 'Science', 2016, 'Oxford University Press', 2, 'C-03'),
  b('To Kill a Mockingbird', 'Harper Lee', '9780061120084', 'Fiction', 2006, 'Harper Perennial', 4, 'D-01'),
  b('1984', 'George Orwell', '9780451524935', 'Fiction', 1950, 'Signet Classics', 4, 'D-02'),
  b('Pride and Prejudice', 'Jane Austen', '9780141439518', 'Fiction', 2002, 'Penguin Classics', 3, 'D-03'),
  b('The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 'Fiction', 2004, 'Scribner', 3, 'D-04'),
  b('The God of Small Things', 'Arundhati Roy', '9780812979657', 'Fiction', 2008, 'Random House', 2, 'D-05'),
  b('Malgudi Days', 'R. K. Narayan', '9780143039655', 'Fiction', 2006, 'Penguin India', 3, 'D-06'),
  b('The Alchemist', 'Paulo Coelho', '9780062315007', 'Fiction', 2014, 'HarperOne', 4, 'D-07'),
  b('Wings of Fire', 'A. P. J. Abdul Kalam', '9788173711466', 'Biography', 1999, 'Universities Press', 3, 'E-01'),
  b('Atomic Habits', 'James Clear', '9781847941831', 'Self-Help', 2018, 'Random House Business', 4, 'F-01'),
  b('Thinking, Fast and Slow', 'Daniel Kahneman', '9780374533557', 'Psychology', 2013, 'Farrar, Straus and Giroux', 2, 'F-02'),
  b('Zero to One', 'Peter Thiel', '9780804139298', 'Business', 2014, 'Crown Business', 3, 'G-01'),
  b('The Lean Startup', 'Eric Ries', '9780307887894', 'Business', 2011, 'Crown Business', 3, 'G-02'),
  b('The Pragmatic Programmer', 'Andrew Hunt, David Thomas', '9780135957059', 'Programming', 2019, 'Addison-Wesley', 3, 'A-06'),
  b('Freakonomics', 'Steven D. Levitt, Stephen J. Dubner', '9780060731335', 'Economics', 2006, 'William Morrow', 2, 'G-03'),
].map((x) => ({ ...x, coverImageUrl: `https://covers.openlibrary.org/b/isbn/${x.isbn}-L.jpg?default=false`, description: `${x.title} by ${x.author}. A demo catalogue entry for LibraryHub.` }));

export const DEMO_DOMAIN = 'demo.libraryhub.local';
