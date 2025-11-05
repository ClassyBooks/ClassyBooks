import { useEffect, useState } from "react";
import "../../App.css";
import { setTitle, getCookie, post, Toast } from "../../functions";
import TeacherNavbar from "./teacherNavbar";
import { useNavigate } from "react-router-dom";

const TeacherChangeUser = () => {
  const [user, setUser] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState(``);
  const [toastType, setToastType] = useState(``);

  const navigate = useNavigate();

  const redirectToPage = (path) => {
    navigate(path); // Use navigate to go to the specified path
  };
  function timeout(delay) {
    return new Promise((res) => setTimeout(res, delay));
  }
  useEffect(() => {
    const fetchData = async () => {
      const body = {
        sessionid: getCookie("sessionId"),
        userid: getCookie("changeUser"),
      };
      let changeUser = await post("/getUser", body, "change user");
      setUser(changeUser);
    };
    fetchData();
  }, []);

  setTitle("Bewerk gebruiker " + user.firstname + " " + user.lastname);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const sessionid = getCookie("sessionId");
    const userid = user.userid;

    let newName = document.getElementById("name").value;
    let newSurname = document.getElementById("surname").value;
    let newClss = document.getElementById("clss").value;
    let newNum = document.getElementById("clssNum").value;
    let newReadinglvl = document.getElementById("readinglvl").value;

    if (newName == null || newName == "") newName = user.firstname;
    if (newSurname == null || newSurname == "") newSurname = user.lastname;
    if (newClss == null || newClss == "") newClss = user.class;
    if (newNum == null || newNum == "") newNum = user.classnum;
    if (newReadinglvl == null || newReadinglvl == "")
      newReadinglvl = user.readinglevel;

    const keys = ["firstname", "lastname", "class", "classnum", "readinglevel"];
    const values = [
      newName,
      newSurname,
      newClss,
      parseInt(newNum),
      newReadinglvl,
    ];

    const body = { sessionid, userid, keys, values };

    const resp = await post(`/changeUser`, body, `changeUser`);

    if (resp.status === 200) {
      setShowToast(true);
      setToastMessage(`Gebruiker succesvol aangepast.`);
      setToastType(`succes`);
      await timeout(1000);
      redirectToPage("/leerkracht/leerlingen");
    } else {
      setShowToast(true);
      setToastMessage(
        `De gebruiker is niet succesvol aangepast. Probeer opnieuw.`
      );
      setToastType(`error`);
    }
  };

  const renderForm = (
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
            className="login"
            id="surname"
            placeholder="Achternaam"
          />
        </div>
        <div className="input-container">
          <input type="text" className="login" id="clss" placeholder="Klas" />
        </div>
        <div className="input-container">
          <input
            type="text"
            className="login"
            id="clssNum"
            placeholder="Klasnummer"
          />
        </div>
        <div className="input-container">
          <input
            type="text"
            className="login"
            id="readinglvl"
            placeholder="Leesniveau"
          />
        </div>
        <div className="button-container">
          <input type="submit" value={"Pas aan"} className="login-button" />
        </div>
      </form>
    </div>
  );

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
        {renderForm}
      </div>
    </div>
  );
};

export default TeacherChangeUser;
