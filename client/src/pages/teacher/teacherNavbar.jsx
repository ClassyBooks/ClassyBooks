import { useEffect, useState } from "react";
import "../../App.css";
import { Link } from "react-router-dom";
import { getCookie } from "../../functions";
import { usePost, useCheckUser } from "../../hooks";
import classNames from "classnames";

function getCurrentURL() {
  return window.location.pathname;
}

const TeacherNavbar = () => {
  const [admin, setAdmin] = useState(false);
  const currentUrl = getCurrentURL();

  useCheckUser();

  var dashboard = classNames({
    lkNavbar: true,
    active: currentUrl === "/leerkracht/overzicht",
  });
  var pupils = classNames({
    lkNavbar: true,
    active: currentUrl === "/leerkracht/leerlingen",
  });
  var library = classNames({
    lkNavbar: true,
    active: currentUrl === "/leerkracht/bibliotheek",
  });
  var pass = classNames({
    lkNavbar: true,
    active: currentUrl === "/leerkracht/verander-wachtwoord",
  });
  var users = classNames({
    lkNavbar: true,
    active: currentUrl === "/beheer/gebruikers-beheren",
  });
  var addUser = classNames({
    lkNavbar: true,
    active: currentUrl === "/beheer/gebruiker-toevoegen",
  });
  var books = classNames({
    lkNavbar: true,
    active: currentUrl === "/beheer/boeken-beheren",
  });
  var addBook = classNames({
    lkNavbar: true,
    active: currentUrl === "/beheer/boek-toevoegen",
  });

  const sessionid = getCookie("sessionId");
  const userid = getCookie("userId");

  const { data: response } = usePost(
    "/api/getUser",
    { sessionid, userid },
    userid || "anonymous" // fallback key to keep hook order stable
  );

  useEffect(() => {
    if (response && typeof response.privilege === "number") {
      setAdmin(response.privilege === 2);
    }
  }, [response]);

  return (
    <div className="lkNavbarDiv">
      <ul className="">
        <li>
          <Link className={dashboard} to="../leerkracht/overzicht">
            Dashboard
          </Link>
        </li>

        <li>
          <Link className={pupils} to="../leerkracht/leerlingen">
            Leerlingen
          </Link>
        </li>

        <li>
          <Link className={library} to="../leerkracht/bibliotheek">
            Bibliotheek
          </Link>
        </li>

        <li>
          <Link className={pass} to="../leerkracht/verander-wachtwoord">
            Verander wachtwoord
          </Link>
        </li>
        {admin ? (
          <>
            <li>
              <Link className={users} to="../beheer/gebruikers-beheren">
                Gebruikers beheren
              </Link>
            </li>
            <li>
              <Link className={addUser} to="../beheer/gebruiker-toevoegen">
                Gebruiker toevoegen
              </Link>
            </li>
            <li>
              <Link className={books} to="../beheer/boeken-beheren">
                Boeken beheren
              </Link>
            </li>
            <li>
              <Link className={addBook} to="../beheer/boek-toevoegen">
                Boek toevoegen
              </Link>
            </li>
            <li>
              <Link
                className="lkNavbar"
                to="https://forms.gle/Rw9o34wPmgoFqLek7"
              >
                Geef feedback
              </Link>
            </li>{" "}
          </>
        ) : (
          <></>
        )}
      </ul>
    </div>
  );
};

export default TeacherNavbar;
