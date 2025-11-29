import { useState, useEffect } from "react";
import "../../App.css";
import TeacherNavbar from "./teacherNavbar";
import { setTitle } from "../../functions";
import Toolbar from "../../components/Toolbar";
import { usePost } from "../../hooks";
import { useNavigate } from "react-router-dom";

const TeacherLib = () => {

  const navigate = useNavigate();

  const redirectToPage = (path) => {
    navigate(path); // Use navigate to go to the specified path
  };


  setTitle("Bibliotheek");
  const [filterdBooks, setFilterdBooks] = useState(null);
  const [showAll, setShowAll] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [sort, setSort] = useState("title");
  const [sortDirection, setSortDirection] = useState("ascending");
  const [filter, setFilter] = useState("none");
  const [locations, setLocations] = useState([]);
  const [readinglevels, setReadinglevels] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); 

  const books = usePost("/allMaterials", {}, "allMaterials");
  useEffect(() => {
    if (books.data && !books.isLoading) {
      setFilterdBooks(books.data);
      setLocations([
        ...new Set(books.data.map((book) => book.place?.toLowerCase().trim())),
      ]);
      setReadinglevels([
        ...new Set(
          books.data.map((book) =>
            book.descr.readinglevel?.toLowerCase().trim()
          )
        ),
      ]);
    }
  }, [books]);

  if (books.isLoading || !filterdBooks) {
    return <div>Loading...</div>;
  }

  const handleChangeFilter = (event) => {
    const { selectedIndex, options } = event.currentTarget;
    const selectedOption = options[selectedIndex];
    const selectedFilter = selectedOption.value;
    const selectedFilterGroup = selectedOption.closest("optgroup")?.id;

    setFilter(selectedFilter);
    if (selectedFilterGroup === "place") {
      const selectedFilterBooks = books.data.filter((book) =>
        book.place?.toLowerCase().trim().includes(selectedFilter)
      );
      setFilterdBooks(selectedFilterBooks);
    }
    if (selectedFilterGroup === "readinglevel") {
      const selectedFilterBooks = books.data.filter((book) =>
        book.descr.readinglevel?.toLowerCase().trim().includes(selectedFilter)
      );
      setFilterdBooks(selectedFilterBooks);
    }
    if (selectedFilterGroup === "available") {
      const selectedFilterBooks = books.data.filter((book) =>
        book.available.includes(selectedFilter)
      );
      setFilterdBooks(selectedFilterBooks);
    }

    if (selectedFilter === "none") setFilterdBooks(books.data);
  };

  const handleChangeSort = (event) => {
    const selectedSort = event.target.value;
    const selectedDirection = sortDirection;

    setSort(selectedSort);

    const sortedMaterials = [...filterdBooks].sort((a, b) => {
      if (selectedDirection === "ascending") {
        if (a[selectedSort] < b[selectedSort]) return -1;
        if (a[selectedSort] > b[selectedSort]) return 1;
        return 0;
      } else if (selectedDirection === "descending") {
        if (a[selectedSort] > b[selectedSort]) return -1;
        if (a[selectedSort] < b[selectedSort]) return 1;
        return 0;
      }
      return null;
    });

    setFilterdBooks(sortedMaterials); // Update the sorted data
  };

  const handleChangeDirection = (event) => {
    const selectedSort = sort; // Get the currently selected sort key
    const selectedDirection = event.target.value; // Get the newly selected sort direction

    setSortDirection(selectedDirection); // Update the sort direction

    if (filterdBooks) {
      setFilterdBooks(
        [...filterdBooks].sort((a, b) => {
          if (selectedDirection === "ascending")
            return a[selectedSort] > b[selectedSort] ? 1 : -1;
          if (selectedDirection === "descending")
            return a[selectedSort] < b[selectedSort] ? 1 : -1;
          return 0;
        })
      );
    }
  };

  const handleSearch = (event) => {
    const query = event.target.value
      .toLowerCase()
      .split("")
      .map((e) => {
        if (e === "&") {
          return "1";
        } else if (e === "é") {
          return "2";
        } else if (e === '"') {
          return "3";
        } else if (e === "'") {
          return "4";
        } else if (e === "(") {
          return "5";
        } else if (e === "§") {
          return "6";
        } else if (e === "è") {
          return "7";
        } else if (e === "!") {
          return "8";
        } else if (e === "ç") {
          return "9";
        } else if (e === "ç") {
          return "9";
        } else if (e === "à") {
          return "0";
        } else {
          return e;
        }
      })
      .join("");

    setSearchQuery(query);

    const regex = new RegExp(query, "i");

    const searchedBooks = books.data.filter(
      (book) =>
        regex.test(book?.title) || // Check if title exists
        regex.test(book?.descr?.author) || // Check if descr and author exist
        regex.test(book?.isbn) // Check if ISBN exists
    );

    setFilterdBooks(searchedBooks);
  };

  function handleLend() {
    document.cookie = `lendMaterial=${selectedBook.materialid}; path=/`;
    redirectToPage("/leerkracht/uitlenen");
  }

  return (
    <div>
      <div>
        <TeacherNavbar></TeacherNavbar>
      </div>
      <div className="content">
        <Toolbar
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          searchLabel="Titel, auteur, ISBN..."
          sortOptions={[
            { value: "title", label: "Titel" },
            { value: "avgscore", label: "Score" },
            { value: "lendcount", label: "Uitgeleend" },
            { value: "available", label: "Beschikbaar" },
            { value: "place", label: "Locatie" },
          ]}
          sort={sort}
          sortDirection={sortDirection}
          filter={filter}
          onSortChange={handleChangeSort}
          onSortDirectionChange={handleChangeDirection}
          onFilterChange={handleChangeFilter}
          filterOptions={[
            {
              id: "available",
              label: "Beschikbaarheid",
              options: [
                { value: "1", label: "Beschikbaar" },
                { value: "0", label: "Onbeschikbaar" },
              ],
            },
            {
              id: "place",
              label: "Locatie",
              options: locations.map((loc) => ({ value: loc, label: loc })),
            },
            {
              id: "readinglevel",
              label: "Niveau",
              options: readinglevels.map((level) => ({
                value: level,
                label: level,
              })),
            },
          ]}
        />

        {showAll ? (
          <div className="itemList">
            {" "}
            {filterdBooks.map((book) => (
              <li
                className="bookItem"
                onClick={() => {
                  setSelectedBook(book);
                  setShowAll(false);
                }}
              >
                <img src={book.descr.cover} alt="" className="cover" />
                <h3>{book.title}</h3>
              </li>
            ))}
          </div>
        ) : (
          <div>
            <h2>{selectedBook.title}</h2>
            <h3>Auteur: {selectedBook.descr.author}</h3>
            <img src={selectedBook.descr.cover} alt="" />
            <p>Locatie: {selectedBook.place}</p>
            <p>Paginas: {selectedBook.descr.pages}</p>
            <p>
              {selectedBook.lendoutto
                ? `Is uitgeleend door: ${selectedBook.lendoutto}`
                : ""}
            </p>
            <button className="button" onClick={() => handleLend()}>Leen uit voor een leerling</button>
            <button onClick={() => setShowAll(true)} className="button">
              Toon alle boeken
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherLib;
