import { useState, useEffect } from "react";
import "../../App.css";
import { getCookie, post, setTitle, Toast } from "../../functions";
import crypto from "crypto-js";
import TeacherNavbar from "../teacher/teacherNavbar";
import { usePost } from "../../hooks";

const ChangeUserPass = () => {
  setTitle("Verander wachtwoord van gebruiker");

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState(``);
  const [toastType, setToastType] = useState(``);

  const userid = getCookie("changePwUser");
  const sessionid = getCookie("sessionId");

  const handleSubmit = async () => {
    const sessionId = sessionid;
    const Newpass = document.getElementById("Newpass").value;
    const NewpassCheck = document.getElementById("NewpassCheck").value;

    if (Newpass.value !== NewpassCheck.value) {
      setShowToast(true);
      setToastMessage(`Voer 2 maal hetzelfde wachtwoord in.`);
      setToastType(`warning`);
    }
    if (Newpass.value === NewpassCheck.value) {
      let body;
      if (user.privilege === 0) {
        var newSha256 = crypto
          .SHA256(user.class + user.classnum + Newpass)
          .toString();
        var newMd5 = crypto
          .MD5(user.class + user.classnum + Newpass + newSha256)
          .toString();
        body = { sessionId, newSha256, newMd5, userid };
      } else {
        var newSha256 = crypto
          .SHA256(user.firstname + user.lastname + Newpass)
          .toString();
        var newMd5 = crypto
          .MD5(user.firstname + user.lastname + Newpass + newSha256)
          .toString();
        body = { sessionId, newSha256, newMd5, userid };
      }

      if (
        window.confirm(
          "Bent u zeker dat u " +
            user.firstname +
            " " +
            user.lastname +
            ' zijn/haar wachtwoord wilt veranderen in "' +
            Newpass +
            '"'
        )
      ) {
        const resp = await post("/changePassword", body);
        if (resp === "Changed password") {
          setShowToast(true);
          setToastMessage(`Wachtwoord succesvol veranderd.`);
          setToastType(`succes`);
        } else {
          setShowToast(true);
          setToastMessage(`Wachtwoord veranderen mislukt. Probeer opnieuw.`);
          setToastType(`error`);
        }
      }
    }
  };

  const body = { sessionid, userid };

  const { data: user, isLoading } = usePost("/getUser", body, userid);

  if (!user && isLoading) {
    return <div>Loading...</div>;
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
      <div>
        {user.firstname + " " + user.lastname}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          <div className="input-container">
            <input
              type="password"
              name="Newpass"
              required
              placeholder="Nieuw wachtwoord"
              id="Newpass"
              className="login"
            />
          </div>
          <div className="input-container">
            <input
              type="password"
              name="NewpassCheck"
              required
              placeholder="Bevestig nieuw wachtwoord"
              id="NewpassCheck"
              className="login"
            />
          </div>
          <div className="button-container">
            <input
              type="submit"
              value={"Verander wachtwoord"}
              className="button"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangeUserPass;
