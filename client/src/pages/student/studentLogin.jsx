import { useState } from "react";
import "../../App.css";
import { post, setTitle, Toast } from "../../functions";
import crypto from "crypto-js";
import { useNavigate } from "react-router-dom";

const StudentLogin = () => {
  setTitle("Leerling login");

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState(``);
  const [toastType, setToastType] = useState(``);

  const navigate = useNavigate();

  const redirectToPage = (path) => {
    navigate(path); // Use navigate to go to the specified path
  };

  const request = async (body) => {
    const response = await post("/api/loginPupil", body, "student login");
    if (response.privilege !== 0) {
      setShowToast(true);
      setToastMessage(
        `Leerkrachten en beheerders moeten zich inloggen via de loginpagina voor leerkrachten.`
      );
      setToastType(`warning`);
    } else if (response.privilege === 0) {
      document.cookie = "sessionId=" + response.sessionid + ";path=/";
      document.cookie = "userId=" + response.userid + ";path=/";
      redirectToPage("./bibliotheek");
    }
  };

  const HandleSubmit = (e) => {
    e.preventDefault();
    var { clss, number, pass } = document.forms[0];
    clss = clss.value;
    number = number.value;
    pass = pass.value;

    var sha256 = crypto.SHA256(clss + number + pass).toString();
    var md5 = crypto.MD5(clss + number + pass + sha256).toString();
    const body = { clss, number, sha256, md5 };
    request(body);
  };
  //Login form
  const renderForm = (
    <div className="form">
      <form onSubmit={HandleSubmit}>
        <div className="input-container">
          <input
            type="text"
            name="clss"
            required
            placeholder="Klas"
            className="login big"
            autoFocus
          />
        </div>
        <div className="input-container">
          <input
            type="number"
            className="login big"
            name="number"
            required
            placeholder="Klasnummer"
          />
        </div>
        <div className="input-container">
          <input
            type="password"
            name="pass"
            required
            placeholder="Wachtwoord"
            className="login big"
          />
        </div>
        <div className="button-container">
          <input type="submit" value={"Login"} className="login-button big" />
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
};

export default StudentLogin;
