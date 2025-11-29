import { useState } from "react";
import "../../App.css";
import { setTitle, getCookie, post, Toast } from "../../functions";
import { useNavigate } from "react-router-dom";
import TeacherNavbar from "../teacher/teacherNavbar";
import { usePost } from "../../hooks";

const AdminChangeUser = () => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("");

  const navigate = useNavigate();
  const sessionid = getCookie("sessionId");
  const userid = getCookie("changeUser");
  const body = { sessionid, userid };

  const {
    data: user,
    isLoading,
    error,
    invalidate,
  } = usePost("/api/getUser", body, userid);

  setTitle(`Bewerk gebruiker ${user?.firstname ?? ""} ${user?.lastname ?? ""}`);

  const timeout = (delay) => new Promise((res) => setTimeout(res, delay));

  const redirectToPage = (path) => navigate(path);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const sessionid = getCookie("sessionId");

    let newName = document.getElementById("name").value || user.firstname;
    let newSurname = document.getElementById("surname").value || user.lastname;
    let newClss = document.getElementById("clss").value || user.class;
    let newNum =
      parseInt(document.getElementById("clssNum").value) || user.classnum;
    let newReadinglvl =
      document.getElementById("readinglvl").value || user.readinglevel;

    const keys = ["firstname", "lastname", "class", "classnum", "readinglevel"];
    const values = [newName, newSurname, newClss, newNum, newReadinglvl];
    const resp = await post(
      "/api/changeUser",
      { sessionid, userid: user.userid, keys, values },
      "changeUser"
    );
    console.log(await resp);
    if ((await resp) === "Statement executed correctly") {
      setShowToast(true);
      setToastMessage("Gebruiker succesvol aangepast.");
      setToastType("success");
      await timeout(1000);
      redirectToPage("/beheer/gebruikers-beheren");
    } else {
      setShowToast(true);
      setToastMessage(
        "De gebruiker is niet succesvol aangepast. Probeer opnieuw."
      );
      setToastType("error");
    }
    invalidate();
  };

  if (isLoading) return <div>Gebruiker laden...</div>;
  if (error || !user) return <div>Kon gebruiker niet laden.</div>;

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
        <h2>
          Verander gegevens van {user.firstname} {user.lastname}
        </h2>
        <div className="form">
          <form onSubmit={handleSubmit}>
            <div className="input-container">
              <input
                type="text"
                id="name"
                placeholder="Voornaam"
                className="login"
                autoFocus
              />
            </div>
            <div className="input-container">
              <input
                type="text"
                id="surname"
                placeholder="Achternaam"
                className="login"
              />
            </div>
            <div className="input-container">
              <input
                type="text"
                id="clss"
                placeholder="Klas"
                className="login"
              />
            </div>
            <div className="input-container">
              <input
                type="text"
                id="clssNum"
                placeholder="Klasnummer"
                className="login"
              />
            </div>
            <div className="input-container">
              <input
                type="text"
                id="readinglvl"
                placeholder="Leesniveau"
                className="login"
              />
            </div>
            <div className="button-container">
              <input type="submit" value="Pas aan" className="login-button" />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminChangeUser;
