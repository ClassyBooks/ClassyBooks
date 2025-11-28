import "../../App.css";
import crypto from "crypto-js";
import { post, setTitle, Toast } from "../../functions";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function TeacherLogin() {
  setTitle("Leerkracht login");

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState(``);
  const [toastType, setToastType] = useState(``);

  const navigate = useNavigate();

  const redirectToPage = (path) => {
    navigate(path); // Use navigate to go to the specified path
  };

  const request = async (name, surname, sha256, md5) => {
    const body = { name, surname, sha256, md5 };
    const response = await post("/loginTeacher", body, "teacher login");

    document.cookie = "sessionId=" + response.sessionid + ";path=/";
    document.cookie = "userId=" + response.userid + ";path=/";

    if (response.status === 400) {
      setShowToast(true);
      setToastMessage(
        `Ongeldige login gegevens. Controleer ze en probeer opnieuw.`
      );
      setToastType(`error`);
    }

    if (response.privilege === 1) {
      redirectToPage("../leerkracht/overzicht");
    }
    if (response.privilege === 2) {
      redirectToPage("../beheer/gebruikers-beheren");
    }
  };

  const handleSubmit = (event) => {
    //Prevent page reload
    event.preventDefault();

    var { name, surname, pass } = document.forms[0];

    var sha256 = crypto
      .SHA256(name.value + surname.value + pass.value)
      .toString();
    var md5 = crypto
      .MD5(name.value + surname.value + pass.value + sha256)
      .toString();
    request(name.value, surname.value, sha256, md5);
  };

  // JSX code for login form
  const renderForm = (
    <div className="form">
      <form onSubmit={handleSubmit}>
        <div className="input-container">
          <input
            type="text"
            name="name"
            required
            placeholder="Voornaam"
            className="login"
            autoFocus
          />
        </div>
        <div className="input-container">
          <input
            type="text"
            className="login"
            name="surname"
            required
            placeholder="Achternaam"
          />
        </div>
        <div className="input-container">
          <input
            type="password"
            name="pass"
            required
            placeholder="Wachtwoord"
            className="login"
          />
        </div>
        <div className="button-container">
          <input type="submit" value={"Login"} className="login-button" />
        </div>
      </form>
    </div>
  );

  return (
    <div className="app">
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          duration={3000}
          onClose={() => setShowToast(false)}
        />
      )}
      <div className="login-form">
        <div className="title">Log in</div>
        {renderForm}
      </div>
    </div>
  );
}

export default TeacherLogin;
