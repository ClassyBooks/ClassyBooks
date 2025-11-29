import { useState, useEffect } from "react";
import "../../App.css";
import { getCookie, post, setTitle, Toast } from "../../functions";
import Toolbar from "../../components/Toolbar";
import { usePost, useCheckUser } from "../../hooks";

const StudentLib = () => {
  setTitle("Bibliotheek");
  useCheckUser(0);

  const [filteredBooks, setFilteredBooks] = useState([]);
  const [showAll, setShowAll] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [sort, setSort] = useState("title");
  const [sortDirection, setSortDirection] = useState("ascending");
  const [filter, setFilter] = useState("none");
  const [locations, setLocations] = useState([]);
  const [readingLevels, setReadingLevels] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("");

  const sessionid = getCookie("sessionId");
  const userid = getCookie("userId");

  const books = usePost("/api/allMaterials", {}, "allMaterials");
  const user = usePost("/api/getUser", { sessionid, userid }, userid);

  const currentBook = usePost(
    "/api/getMaterial",
    { sessionid, materialid: user?.data?.materials?.[0] },
    user?.data?.materials?.[0]
  );

  useEffect(() => {
    if (books?.data) {
      setFilteredBooks(books.data);
    }
  }, [books?.data]);

  useEffect(() => {
    if (books?.data) {
      setLocations([
        ...new Set(
          books.data
            .map((book) => book.place?.toLowerCase().trim())
            .filter(Boolean)
        ),
      ]);
      setReadingLevels([
        ...new Set(
          books.data
            .map((book) => book.descr?.readinglevel?.toLowerCase().trim())
            .filter(Boolean)
        ),
      ]);
    }
  }, [books?.data]);

  if (books.isLoading || !books.data) {
    return <div>Loading...</div>;
  }

  async function lend(materialid) {
    const userid = getCookie("userId");
    const resp = await post("/api/lendMaterial", { materialid, userid });
    console.log(await resp);
    if (resp) {
      const date = new Date(await resp);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const timeText = `${day}/${month}/${year}`;

      setToastMessage(`Je hebt tot ${timeText} om het boek terug te brengen.`);
      setToastType("success");
      setShowToast(true);
    } else {
      setToastMessage("Uitlenen mislukt. Probeer opnieuw.");
      setToastType("error");
      setShowToast(true);
    }
  }

  const handleChangeFilter = (event) => {
    const { selectedIndex, options } = event.currentTarget;
    const selectedOption = options[selectedIndex];
    const selectedFilter = selectedOption.value;
    const group = selectedOption.closest("optgroup")?.id;

    setFilter(selectedFilter);

    let filtered = books.data;

    if (group === "place") {
      filtered = filtered.filter((book) =>
        book.place?.toLowerCase().includes(selectedFilter)
      );
    } else if (group === "readinglevel") {
      filtered = filtered.filter((book) =>
        book.descr?.readinglevel?.toLowerCase().includes(selectedFilter)
      );
    } else if (group === "available") {
      filtered = filtered.filter((book) =>
        book.available?.includes(selectedFilter)
      );
    }

    if (selectedFilter === "none") filtered = books.data;
    setFilteredBooks(filtered);
  };

  const handleChangeSort = (event) => {
    const selectedSort = event.target.value;
    setSort(selectedSort);
    sortBooks(filteredBooks, selectedSort, sortDirection);
  };

  const handleChangeDirection = (event) => {
    const dir = event.target.value;
    setSortDirection(dir);
    sortBooks(filteredBooks, sort, dir);
  };

  const sortBooks = (list, key, direction) => {
    const sorted = [...list].sort((a, b) => {
      const aValue = a[key] ?? "";
      const bValue = b[key] ?? "";
      return direction === "ascending"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
    setFilteredBooks(sorted);
  };

  // 🔍 Search
  const handleSearch = (event) => {
    const query = normalizeSearch(event.target.value.toLowerCase());
    setSearchQuery(query);

    const regex = new RegExp(query, "i");
    const searched = books.data.filter(
      (book) =>
        regex.test(book?.title) ||
        regex.test(book?.descr?.author) ||
        regex.test(book?.isbn)
    );

    setFilteredBooks(searched);
  };

  // Helper: normalize special chars
  const normalizeSearch = (input) =>
    input
      .split("")
      .map((e) => {
        const replacements = {
          "&": "1",
          é: "2",
          '"': "3",
          "'": "4",
          "(": "5",
          "§": "6",
          è: "7",
          "!": "8",
          ç: "9",
          à: "0",
        };
        return replacements[e] ?? e;
      })
      .join("");

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

          {currentBook?.data ? (
            <div>
              <button
                onClick={() => window.location.replace("lever-in")}
                className="button big2"
              >
                Dien {currentBook.data.title} in
              </button>
            </div>
          ) : null}

          {showAll ? (
            <div className="itemList">
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

              {selectedBook.available?.includes("1") ? (
                <button
                  onClick={() => lend(selectedBook.materialid)}
                  className="button big2"
                >
                  Leen {selectedBook.title} uit
                </button>
              ) : (
                <p>Dit boek is momenteel niet beschikbaar.</p>
              )}
            </div>
          )}
        </div>
      </center>
    </div>
  );
};

export default StudentLib;
