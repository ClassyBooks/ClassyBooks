import { useState, useEffect } from "react";
import "../../App.css";
import {
  useCheckUser,
  getCookie,
  post,
  setTitle,
  Toast,
} from "../../functions";
import Toolbar from "../../components/Toolbar";

const StudentLib = () => {
  setTitle("Bibliotheek");
  useCheckUser(0);

  // vars
  const [books, setBooks] = useState(null);
  const [filteredBooks, setFilteredBooks] = useState(null);
  const [showAll, setShowAll] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [sort, setSort] = useState("title");
  const [sortDirection, setSortDirection] = useState("ascending");
  const [filter, setFilter] = useState("none");
  const [locations, setLocations] = useState([]);
  const [readingLevels, setReadingLevels] = useState([]);
  const [currentBook, setCurrentBook] = useState(null);
  const [searchQuery, setSearchQuery] = useState(""); // New search state

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState(``);
  const [toastType, setToastType] = useState(``);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await post("/allMaterials");
        setBooks(response);
        setFilteredBooks(response);
        const sessionid = getCookie("sessionId");
        const userid = getCookie("userId");
        const user = await post("/getUser", { sessionid, userid });
        if ((await user.materials.length) >= 1) {
          const materialid = user.materials[0];
          const currentMaterial = await post(
            "/getMaterial",
            { sessionid, materialid },
            "stuedent lib",
            true
          );
          setCurrentBook(currentMaterial);
        } else {
          setCurrentBook(null);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  // Make sure to initialize 'locations' and 'readingLevels' with all available options from books
  useEffect(() => {
    if (books) {
      setLocations([
        ...new Set(books.map((book) => book.place?.toLowerCase().trim())),
      ]);
      setReadingLevels([
        ...new Set(
          books.map((book) => book.descr.readinglevel?.toLowerCase().trim())
        ),
      ]);
    }
  }, [books]);

  if (!books) {
    return <div>Loading...</div>;
  }

  async function lend(materialid) {
    const userid = getCookie("userId");
    const body = { materialid, userid };
    const resp = await post("/lendMaterial", body);

    if (resp.status === 200) {
      let timeText;
      resp.text().then((t) => {
        const date = new Date(t);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0"); // Maanden starten bij 0
        const year = date.getFullYear();
        timeText = day + `/` + month + `/` + year;

        setShowToast(true);
        setToastMessage(
          `Je hebt tot ${timeText} om het boek terug te brengen.`
        );
        setToastType(`succes`);
      });
    } else {
      setShowToast(true);
      setToastMessage(`Uitlenen mislukt. Probeer opnieuw.`);
      setToastType(`error`);
    }
  }

  const handleChangeFilter = (event) => {
    const { selectedIndex, options } = event.currentTarget;
    const selectedOption = options[selectedIndex];
    const selectedFilter = selectedOption.value;
    const selectedFilterGroup = selectedOption.closest("optgroup")?.id;

    setFilter(selectedFilter);

    let selectedFilterBooks = books;

    if (selectedFilterGroup === "place") {
      selectedFilterBooks = books.filter((book) =>
        book.place?.toLowerCase().trim().includes(selectedFilter)
      );
    } else if (selectedFilterGroup === "readinglevel") {
      selectedFilterBooks = books.filter((book) =>
        book.descr?.readinglevel?.toLowerCase().trim().includes(selectedFilter)
      );
    } else if (selectedFilterGroup === "available") {
      selectedFilterBooks = books.filter((book) =>
        book.available?.includes(selectedFilter)
      );
    }

    if (selectedFilter === "none") selectedFilterBooks = books;

    setFilteredBooks(selectedFilterBooks);
  };

  const handleChangeSort = (event) => {
    const selectedSort = event.target.value;
    const selectedDirection = sortDirection;

    setSort(selectedSort);

    const sortedMaterials = [...filteredBooks].sort((a, b) => {
      const aValue = a[selectedSort] || "";
      const bValue = b[selectedSort] || "";

      if (selectedDirection === "ascending") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else if (selectedDirection === "descending") {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
      return 0;
    });

    setFilteredBooks(sortedMaterials); // Update the sorted data
  };

  const handleChangeDirection = (event) => {
    const selectedSort = sort; // Get the currently selected sort key
    const selectedDirection = event.target.value; // Get the newly selected sort direction

    setSortDirection(selectedDirection); // Update the sort direction

    const sortedMaterials = [...filteredBooks].sort((a, b) => {
      const aValue = a[selectedSort] || "";
      const bValue = b[selectedSort] || "";

      if (selectedDirection === "ascending") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else if (selectedDirection === "descending") {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
      return 0;
    });

    setFilteredBooks(sortedMaterials);
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

    const searchedBooks = books.filter(
      (book) =>
        regex.test(book?.title) || // Check if title exists
        regex.test(book?.descr?.author) || // Check if descr and author exist
        regex.test(book?.isbn) // Check if ISBN exists
    );

    setFilteredBooks(searchedBooks);
  };

  return (
    <div>
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          duration={3000}
          onClose={() => setShowToast(false)}
        />
      )}
      <center>
        <div>
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
                  options: readingLevels.map((level) => ({
                    value: level,
                    label: level,
                  })),
                },
              ]}
            />

            {currentBook ? (
              <div>
                <button
                  onClick={() => window.location.replace("lever-in")}
                  className="button big2"
                >
                  Dien {currentBook.title} in
                </button>
              </div>
            ) : (
              <></>
            )}

            {showAll ? (
              <div className="itemList">
                {" "}
                {filteredBooks.map((book) => (
                  <li
                    key={book.materialid}
                    className="bookItem"
                    onClick={() => {
                      setSelectedBook(book);
                      setShowAll(false);
                    }}
                  >
                    <img src={book.descr?.cover} alt="" className="cover" />
                    <h3>{book.title}</h3>
                  </li>
                ))}
              </div>
            ) : (
              <div>
                <h2>{selectedBook.title}</h2>
                <h3>Auteur: {selectedBook.descr?.author}</h3>
                <img src={selectedBook.descr?.cover} alt="" />
                <p>Locatie: {selectedBook.place}</p>
                <p>Paginas: {selectedBook.descr?.pages}</p>
                <p>
                  {selectedBook.lendoutto
                    ? `Is uitgeleend door: ${selectedBook.lendoutto}`
                    : ""}
                </p>
                <button onClick={() => setShowAll(true)} className="button">
                  Toon alle boeken
                </button>
                {selectedBook.available.includes("1") ? (
                  <button
                    onClick={() => lend(selectedBook.materialid)}
                    className="button big2"
                  >
                    Leen {selectedBook.title} uit
                  </button>
                ) : (
                  <div>
                    <p>Dit boek is momenteel niet beschikbaar.</p>{" "}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </center>
    </div>
  );
};

export default StudentLib;
