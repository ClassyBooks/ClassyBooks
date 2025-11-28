import "./App.css";
import { useEffect, useState } from "react";

//extracs cookie zith given name
export function getCookie(cookieName) {
  var cookies = document.cookie.split(";");

  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i].trim();

    if (cookie.startsWith(cookieName + "=")) {
      return cookie.substring(cookieName.length + 1, cookie.length);
    }
  }

  return null;
}

//changes title
export function setTitle(title) {
  document.title = "Classy Books - " + title;
}

//post to given url
export async function post(url, body = {}, func) {
  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Function: func || "",
      },
    });

    const respType = response.headers.get("Content-Type") || "";

    if (respType.includes("application/json")) {
      const data = await response.json();
      if (!response.ok) {
        // response.statusText may be empty; include status too
        throw new Error(`${response.status} ${response.statusText}`);
      }
      return data;
    } else if (respType.includes("text")) {
      const text = await response.text();
      if (!response.ok)
        throw new Error(`${response.status} ${response.statusText}`);
      return text;
    } else {
      // unknown content-type: try json then text fallback
      try {
        const maybeJson = await response.json();
        return maybeJson;
      } catch {
        const maybeText = await response.text();
        return maybeText;
      }
    }
  } catch (error) {
    console.error("post() Error:", error);
    // return null to make callers explicit about no data
    return null;
  }
}

//changes password of user
export async function changePassword(sha256, md5, newSha256, newMd5) {
  const sessionId = getCookie("sessionId");
  const userid = getCookie("userId");

  const body = { sessionId, userid, sha256, md5, newSha256, newMd5 };
  const resp = await post("/changePassword", body);

  if (resp === "Changed password") {
    return true;
  } else return false;
}

export async function getISBN(isbn) {
  if (!isbn || isbn === "") {
    console.error("Lege ISBN");
    return null;
  }

  try {
    const titelbankResp = await fetch(`/getTitelbank/${isbn}`);
    if (titelbankResp.status === 200) {
      let data = await titelbankResp.json();
      data[0].authors = [data[0].author];
      return data[0];
    }
  } catch (error) {
    throw new Error(`titelbank error: ${error}`);
  }

  try {
    // Zoek in Google Books API
    const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=AIzaSyDk85GonrKmFwTl2Iy9WxEdI-Z-Yh34oP4`;
    const googleBooksResponse = await fetch(googleBooksUrl);

    if (!googleBooksResponse.ok) {
      throw new Error(`Google Books API fout: ${googleBooksResponse.status}`);
    }

    const googleBooksData = await googleBooksResponse.json();

    if (googleBooksData.totalItems > 0) {
      return googleBooksData.items[0].volumeInfo; // Retourneer het eerste resultaat
    } else {
      console.warn(
        "Geen boek gevonden in Google Books. Nu zoeken in OpenLibrary..."
      );
    }
  } catch (error) {
    console.error("Fout bij het ophalen van data uit Google Books:", error);
  }

  try {
    // Zoek in OpenLibrary API
    const openLibraryUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
    const openLibraryResponse = await fetch(openLibraryUrl);

    if (!openLibraryResponse.ok) {
      throw new Error(`OpenLibrary API fout: ${openLibraryResponse.status}`);
    }

    const openLibraryData = await openLibraryResponse.json();
    const bookData = openLibraryData[`ISBN:${isbn}`];

    if (bookData) {
      console.log("Boek gevonden in OpenLibrary:", bookData);
      return bookData; // Retourneer de OpenLibrary data
    } else {
      console.warn("Geen boek gevonden in OpenLibrary.");
    }
  } catch (error) {
    console.error("Fout bij het ophalen van data uit OpenLibrary:", error);
  }

  try {
    const resp = await post("/getBibInfo", { isbn });
    const htmlResp = await resp.text();

    // Parse HTML string into a DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlResp, "text/html");

    // Extract title
    const titleElement = doc.querySelector("h3.catalog-item-title");
    const title = titleElement ? titleElement.textContent.trim() : "";

    // Extract authors
    const authors = Array.from(
      doc.querySelectorAll("div.catalog-item__authors a")
    ).map((a) => a.textContent.trim());

    return { title, authors };
  } catch (error) {
    console.error(
      "Fout bij het ophalen van data uit bibliotheek vlaanderen:",
      error
    );
  }

  return null; // Retourneer null als geen enkel boek is gevonden
}

export const Toast = ({
  message,
  type = "info",
  duration = 30000,
  onClose,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Auto-hide the toast after the specified duration
    const timer = setTimeout(() => {
      setVisible(false);
      onClose && onClose(); // Call onClose function when the toast hides
    }, duration);

    return () => clearTimeout(timer); // Clean up the timer on unmount
  }, [duration, onClose]);

  if (!visible) return null; // Render nothing if the toast is hidden

  return (
    <div className={`toast toast-${type}`}>
      <span>{message}</span>
      <button className="toast-close" onClick={() => setVisible(false)}>
        &times;
      </button>
    </div>
  );
};
