import { useEffect, useState } from "react";
import "../../App.css";
import { setTitle, Toast, getCookie } from "../../functions";
import TeacherNavbar from "../teacher/teacherNavbar";
import { usePost, useMutatePost } from "../../hooks";

const ChangeMaterial = () => {
  const [material, setMaterial] = useState(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isbn, setIsbn] = useState("");
  const [cover, setCover] = useState(``);


  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("");

  const body = {
    sessionid: getCookie("sessionId"),
    materialid: getCookie("changeMaterial"),
  };
  const { data, isLoading } = usePost("/api/getMaterial", body, body.materialid);

  const { mutateAsync } = useMutatePost(body.materialid);

  useEffect(() => {
    if (data && data.length > 0) {
      setMaterial(data[0]);
      setIsChecked(!!data[0].available);
    }
  }, [data]);

  setTitle("Bewerk Boek");

  if (isLoading || !material) {
    return <div>Loading...</div>;
  }

  function handleIsbn(value) {
    const decoded = value
      .split("")
      .map((e) => {
        if (e === "&") return "1";
        if (e === "é") return "2";
        if (e === '"') return "3";
        if (e === "'") return "4";
        if (e === "(") return "5";
        if (e === "§") return "6";
        if (e === "è") return "7";
        if (e === "!") return "8";
        if (e === "ç") return "9";
        if (e === "à") return "0";
        return e;
      })
      .join("");
    setIsbn(decoded);
  }

async function handleImg(e) {
  e.preventDefault();

  const form = document.forms[0];
  const uploaded_img = form.elements["uploaded_file"];

  if (!uploaded_img || !uploaded_img.files.length) {
    alert("Selecteer eerst een afbeelding");
    return;
  }

  const data = new FormData();
  data.append("uploaded_file", uploaded_img.files[0]);

  let resp = await fetch("/api/uploadimg", {
    method: "POST",
    body: data,
  });

  resp = await resp.text();
  setCover(resp);
  handleChange("cover", resp);
}


  async function handleChange(key, value) {
    let keys = [key];
    let values = [value];

    const updated = { ...material };
    let descr = { ...updated.descr };

    if (key === "available") {
      values = [value ? 1 : 0];
      updated.available = value ? 1 : 0;
    } else if (["author", "cover", "pages", "readinglevel"].includes(key)) {
      descr[key] = value;
      values = [descr];
      keys = ["descr"];
      updated.descr = descr;
    } else {
      updated[key] = value;
    }

    setMaterial(updated);

    const body = {
      sessionid: getCookie("sessionId"),
      materialid: getCookie("changeMaterial"),
      keys,
      values,
    };

    const resp = await mutateAsync({
      url: "/api/changeMaterial",
      body,
      key: "changeMaterial",
    });

    if (resp === "Statement executed correctly") {
      setShowToast(true);
      setToastMessage(`Boek succesvol aangepast.`);
      setToastType(`succes`);
    } else {
      setShowToast(true);
      setToastMessage(
        `Het boek is niet succesvol aangepast. Probeer later opnieuw.`
      );
      setToastType(`error`);
    }
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

      <div className="content">
        <h2>Verander gegevens van {material.title}</h2>
        <h2>Druk op enter om op te slaan</h2>

        <form>
          <input
            type="text"
            name="title"
            placeholder="Titel"
            className="login"
            defaultValue={material?.title || ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleChange("title", e.target.value);
              }
            }}
          />
          <br />

          <input
            type="text"
            name="place"
            placeholder="Locatie"
            className="login"
            defaultValue={material?.place || ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleChange("place", e.target.value);
              }
            }}
          />
          <br />

          <input
            type="text"
            name="author"
            placeholder="Auteur"
            className="login"
            defaultValue={material?.descr?.author || ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleChange("author", e.target.value);
              }
            }}
          />
          <br />

          <input
            type="hidden"
            name="cover"
            placeholder="Url van de cover"
            className="login"
            defaultValue={material?.descr?.cover || ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleChange("cover", e.target.value);
              }
            }}
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
            className="login"
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
            className="login"
            defaultValue={material?.descr?.pages || ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleChange("pages", e.target.value);
              }
            }}
          />
          <br />

          <input
            type="text"
            name="readinglevel"
            placeholder="Lees niveau"
            className="login"
            defaultValue={material?.descr?.readinglevel || ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleChange("readinglevel", e.target.value);
              }
            }}
          />
          <br />

          <input
            type="text"
            name="isbn"
            placeholder="ISBN"
            className="login"
            value={isbn}
            onInput={(e) => handleIsbn(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleChange("isbn", isbn);
              }
            }}
          />
          <br />

          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => {
              setIsChecked(e.target.checked);
              handleChange("available", e.target.checked);
            }}
          />
          <label>Beschikbaar</label>
          <br />
        </form>
      </div>
    </div>
  );
};

export default ChangeMaterial;
