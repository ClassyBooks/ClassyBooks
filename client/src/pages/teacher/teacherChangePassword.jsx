import "../../App.css";
import crypto from "crypto-js";
import { setTitle, changePassword, Toast } from "../../functions";
import TeacherNavbar from "./teacherNavbar";
import { useState } from "react";

function TeacherChangePassword() {
  setTitle("Verander wachtwoord");

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState(``);
  const [toastType, setToastType] = useState(``);

  const handleSubmit = (event) => {
    //Prevent page reload
    event.preventDefault();

    var { name, surname, Oldpass, Newpass, NewpassCheck } = document.forms[0];

    if (Newpass.value === NewpassCheck.value) {
      var sha256 = crypto
        .SHA256(name.value + surname.value + Oldpass.value)
        .toString();
      var md5 = crypto
        .MD5(name.value + surname.value + Oldpass.value + sha256)
        .toString();

      var newSha256 = crypto
        .SHA256(name.value + surname.value + Newpass.value)
        .toString();
      var newMd5 = crypto
        .MD5(name.value + surname.value + Newpass.value + newSha256)
        .toString();

      const resp = changePassword(sha256, md5, newSha256, newMd5);
      if (resp) {
        setShowToast(true);
        setToastMessage(`Wachtwoord succesvol veranderd.`);
        setToastType(`succes`);
      } else {
        setShowToast(true);
        setToastMessage(`Wachtwoord veranderen mislukt. Probeer opnieuw.`);
        setToastType(`error`);
      }
    } else {
      setShowToast(true);
      setToastMessage(`Wachtwoorden komen niet overeen`);
      setToastType(`error`);
    }
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
            name="Oldpass"
            required
            placeholder="Oud wachtwoord"
            className="login"
          />
        </div>
        <div className="input-container">
          <input
            type="password"
            name="Newpass"
            required
            placeholder="Nieuw wachtwoord"
            className="login"
          />
        </div>
        <div className="input-container">
          <input
            type="password"
            name="NewpassCheck"
            required
            placeholder="Bevestig nieuw wachtwoord"
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
      <nav className="navbar">
        <TeacherNavbar />{" "}
      </nav>
      <div className="login-form">
        <div className="title">Verander wachtwoord</div>
        {renderForm}
      </div>
    </div>
  );
}

export default TeacherChangePassword;
