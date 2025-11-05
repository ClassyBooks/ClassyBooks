import { useNavigate } from "react-router-dom";
import "../../App.css";
import {
  setTitle,
  useCheckUser,
  getCookie,
  post,
  Toast,
} from "../../functions";
import { useEffect, useState } from "react";
import Rating from "@mui/material/Rating";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const ReturnBooks = () => {
  useCheckUser(0);
  setTitle("inleveren");

  const [book, setBook] = useState(null);
  const [rating, setRating] = useState(null);
  const [isChecked, setIsChecked] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState(``);
  const [toastType, setToastType] = useState(``);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userid = getCookie("userId");
        const sessionid = getCookie("sessionId");
        const userBody = { sessionid, userid };
        const user = await post("/getUser", userBody);

        const materialid = await user.materials[0];
        const body = { materialid, sessionid };
        const response = await post("/getMaterial", body);
        setBook(await response);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);
  const navigate = useNavigate();

  const redirectToPage = (path) => {
    navigate(path); // Use navigate to go to the specified path
  };

  const handleClick = async () => {
    console.log(book);
    const body = {
      materialid: book.materialid,
      score: rating,
      fullyread: isChecked,
    };
    console.log(body);
    if (rating === null) {
      setShowToast(true);
      setToastMessage(`Geef uw boek eerst een score.`);
      setToastType(`warning`);
    } else if (
      window.confirm(
        "Bent u zeker dat u " +
          book.title +
          " wilt inleveren met een score van " +
          rating +
          "/4?"
      )
    ) {
      const resp = await post("/returnMaterial", body);
      console.log(resp);
      if (resp.status === 200) {
        setShowToast(true);
        setToastMessage(`Boek succesvol`);
        setToastType(`succes`);
        redirectToPage("../leerling/bibliotheek");
      } else {
        setShowToast(true);
        setToastMessage(`Inleveren mislukt. Probeer opnieuw`);
        setToastType(`error`);
        redirectToPage("../leerling/bibliotheek");
      }
    }
  };

  const handleChange = (e) => {
    setIsChecked(e.target.checked);
  };

  return (
    <div>
      <div>
        {showToast && (
          <Toast
            message={toastMessage}
            type={toastType}
            duration={3000}
            onClose={() => setShowToast(false)}
          />
        )}
      </div>
      <div>
        {book ? (
          <Box className="" sx={{ "& > legend": { mt: 2 } }}>
            <Typography>Hoeveel sterren geef je het boek?</Typography>
            <Rating
              name="simple-controlled"
              value={rating}
              max={4}
              onChange={(event, newValue) => {
                setRating(newValue + 0.0);
              }}
            />
            <input
              type="checkbox"
              name="fullyRead"
              id="fullyRead"
              checked={isChecked}
              onChange={handleChange}
            />
            <label htmlFor="fullyRead">Volledig gelezen?</label>
            <button
              className="button"
              onClick={() => {
                handleClick();
              }}
            >
              Lever {book.title} in
            </button>
          </Box>
        ) : (
          <div></div>
        )}
      </div>
    </div>
  );
};

export default ReturnBooks;
