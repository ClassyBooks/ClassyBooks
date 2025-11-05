import { useState, useEffect } from "react";
import "../../App.css";
import TeacherNavbar from "../teacher/teacherNavbar";
import { post, setTitle, getCookie, Toast } from "../../functions";
import { useNavigate } from "react-router-dom";
import Toolbar from "../../components/Toolbar";
import { usePost } from "../../hooks";

const ManageMaterials = () => {
  setTitle("Beheer boeken");

  const [books, setBooks] = useState([]);
  const [filterdBooks, setFilterdBooks] = useState([]);
  const [showAll, setShowAll] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [sort, setSort] = useState("title");
  const [sortDirection, setSortDirection] = useState("ascending");
  const [filter, setFilter] = useState("none");
  const [locations, setLocations] = useState([]);
  const [readinglevels, setReadinglevels] = useState([]);
  const [lendTo, setLendTo] = useState(null);
  const [userId, setUserId] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState(``);
  const [toastType, setToastType] = useState(``);

  const navigate = useNavigate();

  const redirectToPage = (path) => navigate(path);

  const {
    data: booksResp,
    isLoading,
    error,
    invalidate,
  } = usePost("/allMaterials", {}, "allMaterials");

  const { data: bookResponse, isLoading: isBookLoading } = usePost(
    "/getMaterial",
    { materialid: selectedBookId, sessionid: getCookie("sessionId") },
    selectedBookId,
    { enabled: !!selectedBookId }
  );

  const { data: lenderResponse } = usePost(
    "/getUser",
    { userid: userId, sessionid: getCookie("sessionId") },
    userId,
    { enabled: !!userId }
  );

  useEffect(() => {
    if (!isLoading && !error && Array.isArray(booksResp)) {
      setBooks(booksResp);
      setFilterdBooks(booksResp);

      setLocations(
        [
          ...new Set(
            booksResp.map((b) => (b.place || "").toLowerCase().trim())
          ),
        ].filter(Boolean)
      );

      setReadinglevels(
        [
          ...new Set(
            booksResp.map((b) =>
              (b.descr?.readinglevel || "").toLowerCase().trim()
            )
          ),
        ].filter(Boolean)
      );
    } else if (!isLoading && !error && booksResp == null) {
      setBooks([]);
      setFilterdBooks([]);
      setLocations([]);
      setReadinglevels([]);
    }
  }, [booksResp, isLoading, error]);

  useEffect(() => {
    if (bookResponse) {
      const book = Array.isArray(bookResponse) ? bookResponse[0] : bookResponse;
      setSelectedBook(book);
      setUserId(book?.lendoutto ?? null);
    }
  }, [bookResponse]);

  useEffect(() => {
    if (lenderResponse) {
      setLendTo(lenderResponse);
    }
  }, [lenderResponse]);

  function reloadPage() {
    setSelectedBook(null);
    setSelectedBookId(null);
    setShowAll(true);
    setLendTo(null);
    invalidate();
  }

  async function del(materialid) {
    const sessionId = getCookie("sessionId");
    const body = { sessionId, materialid };
    if (window.confirm("Weet u zeker dat u dit boek wilt verwijderen?")) {
      await post("/removeMaterial", body);
      reloadPage();

      setShowToast(true);
      setToastMessage(`Boek succesvol verwijderd.`);
      setToastType(`succes`);
    }
  }

  function change(id) {
    document.cookie = "changeMaterial = " + id;
    redirectToPage(`bewerken`);
  }

  const HandleSelect = (bookid) => {
    setShowAll(false);
    setSelectedBookId(bookid);
  };

  const handleChangeFilter = (event) => {
    const { selectedIndex, options } = event.currentTarget;
    const selectedOption = options[selectedIndex];
    const selectedFilter = selectedOption.value;
    const selectedFilterGroup = selectedOption.closest("optgroup")?.id;

    setFilter(selectedFilter);

    if (selectedFilter === "none") {
      setFilterdBooks(books);
      return;
    }

    let selectedFilterBooks = books;
    if (selectedFilterGroup === "place") {
      selectedFilterBooks = books.filter((book) =>
        (book.place || "").toLowerCase().includes(selectedFilter)
      );
    } else if (selectedFilterGroup === "readinglevel") {
      selectedFilterBooks = books.filter((book) =>
        (book.descr?.readinglevel || "").toLowerCase().includes(selectedFilter)
      );
    } else if (selectedFilterGroup === "available") {
      selectedFilterBooks = books.filter((book) =>
        String(book.available || "").includes(selectedFilter)
      );
    }

    setFilterdBooks(selectedFilterBooks);
  };

  const handleChangeSort = (event) => {
    const selectedSort = event.target.value;
    setSort(selectedSort);
    if (!filterdBooks) return;

    const sorted = [...filterdBooks].sort((a, b) => {
      const av = a[selectedSort];
      const bv = b[selectedSort];
      return sortDirection === "ascending"
        ? av > bv
          ? 1
          : av < bv
          ? -1
          : 0
        : av > bv
        ? -1
        : av < bv
        ? 1
        : 0;
    });

    setFilterdBooks(sorted);
  };

  const handleChangeDirection = (event) => {
    const selectedDirection = event.target.value;
    setSortDirection(selectedDirection);
    if (!filterdBooks) return;

    setFilterdBooks(
      [...filterdBooks].sort((a, b) => {
        const av = a[sort];
        const bv = b[sort];
        return selectedDirection === "ascending"
          ? av > bv
            ? 1
            : -1
          : av < bv
          ? 1
          : -1;
      })
    );
  };

  const handleSearch = (event) => {
    const query = event.target.value
      .toLowerCase()
      .split("")
      .map((e) => {
        const map = {
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
        return map[e] || e;
      })
      .join("");

    setSearchQuery(query);
    if (!books) return;

    const regex = new RegExp(query, "i");
    const searchedBooks = books.filter(
      (book) =>
        regex.test(book?.title || "") ||
        regex.test(book?.descr?.author || "") ||
        regex.test(book?.isbn || "")
    );

    setFilterdBooks(searchedBooks);
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
      <TeacherNavbar />
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
            {Array.isArray(filterdBooks) && filterdBooks.length ? (
              filterdBooks.map((book) => (
                <li
                  key={book.materialid}
                  className="bookItem"
                  onClick={() => HandleSelect(book.materialid)}
                >
                  <img
                    src={book.descr?.cover || ""}
                    alt={book.title || ""}
                    className="cover"
                  />
                  <h3>{book.title}</h3>
                </li>
              ))
            ) : (
              <p>{isLoading ? "Laden..." : "Geen boeken gevonden"}</p>
            )}
          </div>
        ) : isBookLoading ? (
          <p>Laden...</p>
        ) : (
          selectedBook && (
            <div>
              <h2>{selectedBook.title}</h2>
              <h3>Auteur: {selectedBook.descr?.author?.trim()}</h3>
              <img src={selectedBook.descr?.cover || ""} alt="" />
              <p>Locatie: {selectedBook.place?.toLowerCase().trim()}</p>
              <p>Pagina's: {selectedBook.descr?.pages || "-"}</p>
              <p>
                {lendTo
                  ? `Is uitgeleend door: ${lendTo.firstname} ${lendTo.lastname}`
                  : ""}
              </p>
              <button
                onClick={() => del(selectedBook.materialid)}
                className="button"
              >
                Verwijder Boek
              </button>
              <button
                onClick={() => change(selectedBook.materialid)}
                className="button"
              >
                Verander boek
              </button>
              <button onClick={() => setShowAll(true)} className="button">
                Toon alle boeken
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ManageMaterials;
