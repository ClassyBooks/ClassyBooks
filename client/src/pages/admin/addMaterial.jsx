import "../../App.css";
import { post, setTitle, getCookie, Toast, getISBN } from "../../functions";
import { useState } from "react";
import TeacherNavbar from "../teacher/teacherNavbar";
import { useNavigate } from "react-router-dom";

const AddMaterial = () => {
  setTitle("Boeken toevoegen");

  const navigate = useNavigate();

  const redirectToPage = (path) => {
    navigate(path); // Use navigate to go to the specified path
  };

  const [isChecked, setIsChecked] = useState(true);
  const [isbn, setIsbn] = useState();
  const [title, setBookTitle] = useState(``);
  const [author, setAuthor] = useState(``);
  const [pages, setPages] = useState(``);
  const [cover, setCover] = useState(``);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState(``);
  const [toastType, setToastType] = useState(``);
  const [loader, setLoader] = useState(false);

  async function addMaterial(isChecked) {
    const sessionid = getCookie("sessionId");
    var [title, place, author, , , , pages, readinglevel, isbn] =
      document.forms[0];
    title = title.value;
    place = place.value;
    author = author.value;
    pages = pages.value;
    readinglevel = readinglevel.value;
    isbn = isbn.value;
    const available = isChecked;
    const description = { author, cover, pages, readinglevel };
    var body = { sessionid, title, place, description, available, isbn };
    if (title === "" || place === "" || author === "") {
      setShowToast(true);
      setToastMessage(`Je moet de velden Titel, Locatie en Auteur invullen`);
      setToastType(`error`);
    } else {
      const resp = await post("/createMaterial", body);
      if (resp.status === 200) {
        setShowToast(true);
        setToastMessage(`Boek succesvol toegevoegd`);
        setToastType(`succes`);
      }
    }
  }

  function handleIsbn(value) {
    const decoded = value
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
        } else return e;
      })
      .join("");

    setIsbn(decoded);
  }

  function handleChange(e) {
    setIsChecked(e.target.checked);
  }

  async function handleIsbnEnter(e) {
    e.preventDefault();

    const isbnData = await getISBN(isbn);

    setLoader(!isbnData);
    setAuthor(await isbnData?.authors[0]);
    setBookTitle(await isbnData?.title);
    let img = new Image();

    img.src = `http://classybooks.woutvdb.uk/api/getImage.php?imageId=${isbn}`;
    img.onload = function () {
      console.log(`Testing bib cover:`);
      console.log(img.naturalHeight);
      console.log(img.naturalWidth);
      console.log(img.src);
      if (img.naturalHeight !== 0 && img.naturalWidth !== 0) {
        setCover(img.src);
      } else {
        img.src = `https://webservices.bibliotheek.be/index.php?func=cover&ISBN=${isbn}&amp;coversize=large`;
        img.onload = function () {
          console.log(`Testing titelbank cover:`);
          console.log(img.naturalHeight);
          console.log(img.naturalWidth);
          console.log(img.src);
          if (img.naturalHeight !== 0 && img.naturalWidth !== 0) {
            setCover(img.src);
          }
        };
      }
    };

    setPages(await isbnData?.pageCount);
  }

  async function handleImg(e) {
    e.preventDefault();
    let [, , , uploaded_img] = document.forms[0];
    let data = new FormData();
    data.append("uploaded_file", uploaded_img.files[0]);
    let resp = await fetch("/uploadimg", {
      method: "POST",
      body: data,
      "content-type": "multipart/form-data",
    });
    resp = await resp.text();
    console.log(resp);
    setCover(resp);
  }

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
      <nav>
        <TeacherNavbar />
      </nav>
      <form onSubmit={(e) => e.preventDefault}>
        <input
          type="text"
          name="title"
          placeholder="Titel"
          class="login"
          value={title}
          onInput={(e) => setBookTitle(e.target.value)}
        />
        <br />
        <input type="text" name="place" placeholder="Locatie" class="login" />
        <br />
        <input
          type="text"
          name="author"
          placeholder="Auteur"
          class="login"
          value={author}
          onInput={(e) => setAuthor(e.target.value)}
        />
        <br />
        <input
          type="file"
          name="uploaded_file"
          accept=".png, .jpg, .jpeg, .gif, .bmp, .tif"
        />
        <button type="button" onClick={(e) => handleImg(e)}>
          Cover uploaden
        </button>
        <input
          type="url"
          style={{ visibility: "hidden" }}
          name="cover"
          placeholder="Url van de cover"
          class="login"
          value={cover}
          onInput={(e) => setCover(e.target.value)}
        />
        <br />
        <img src={cover} alt="" className="cover bookitem" />
        <br />
        <input
          type="number"
          name="pages"
          placeholder="Aantal paginas"
          class="login"
          value={pages}
          onInput={(e) => setPages(e.target.value)}
        />
        <br />
        <input
          type="text"
          name="readinglevel"
          placeholder="Lees niveau"
          class="login"
        />
        <br />
        <input
          type="text"
          name="isbn"
          placeholder="ISBN"
          class="login"
          value={isbn}
          onInput={(e) => handleIsbn(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleIsbnEnter(e);
          }}
        />
        <br />
        <div
          className="loader login"
          style={{ display: loader ? "block" : "none" }}
        ></div>
        <br />
        <input
          type="checkbox"
          placeholder="Beschikbaar"
          checked={isChecked}
          onChange={handleChange}
        />
        <label htmlFor="">Beschikbaar</label>
        <br />
        <button
          placeholder="Voeg toe"
          onClick={(e) => {
            e.preventDefault();
            addMaterial(isChecked);
          }}
          className="button"
        >
          <p>Voeg toe</p>
        </button>
      </form>
      <button onClick={() => redirectToPage(`../beheer/json-upload`)}>
        Importeren
      </button>
    </div>
  );
};

export default AddMaterial;
