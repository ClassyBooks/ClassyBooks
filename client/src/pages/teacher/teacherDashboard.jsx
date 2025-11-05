import "../../App.css";
import TeacherNavbar from "./teacherNavbar";
import { getCookie, post, setTitle } from "../../functions";
import { useEffect, useState } from "react";

const Dashboard = () => {
  const [books, setBooks] = useState({});
  const [users, setUsers] = useState({});
  const [students, setStudents] = useState(0);
  const [studentBooks, setStudentBooks] = useState(0);
  const [checkedOut, setCheckedOut] = useState(0);
  const [overdue, setOverdue] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const booksData = await post("/allMaterials");
        setBooks(booksData);
        countCheckedOut(booksData);
        countOverdue(booksData);

        const sessionId = getCookie("sessionId");
        const body = { sessionId };
        const usersData = await post("/allUsers", body);
        setUsers(usersData);
        countStudents(usersData);
        countStudentBooks(usersData);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  function countStudents(usersData) {
    const count = usersData.reduce((accumulator, user) => {
      if (user.privilege === 0) {
        return accumulator + 1;
      } else {
        return accumulator;
      }
    }, 0);
    setStudents(count);
  }
  function countStudentBooks(usersData) {
    const count = usersData.reduce((accumulator, user) => {
      if (user.materials.length === 0) {
        return accumulator;
      } else {
        return accumulator + 1;
      }
    }, 0);
    setStudentBooks(count);
  }

  function countCheckedOut(booksData) {
    const count = booksData.reduce((accumulator, book) => {
      if (book.available === "0") {
        return accumulator + 1;
      } else {
        return accumulator;
      }
    }, 0);
    setCheckedOut(count);
  }

  function countOverdue(booksData) {
    const currentDate = new Date();

    const count = booksData.reduce((accumulator, book) => {
      if (book.returndate != null) {
        const returnDate = new Date(book.returndate);
        if (returnDate <= currentDate) {
          return accumulator + 1;
        } else {
          return accumulator;
        }
      } else return accumulator;
    }, 0);

    setOverdue(count);
  }

  return (
    <div className="grid">
      <nav className="navbar">
        <TeacherNavbar />
      </nav>
      <main>
        <div className="inventory">
          <h3 className="caption">Inventaris</h3>
          <div className="books">
            <h1>{books.length}</h1>
            <p>boeken</p>
          </div>
          <div className="students">
            <h1>{users.length}</h1>
            <p>gebruikers</p>
          </div>
          <div className="copies">
            <h1>{students}</h1>
            <p>leerlingen</p>
          </div>
        </div>
        <div className="manage">
          <h3 className="caption">Beheer</h3>
          <div className="studentBooks">
            <h1>{studentBooks}</h1>
            <p>Leerlingen met boeken</p>
          </div>
          <div className="overdue">
            <h1>{overdue}</h1>
            <p>boeken overtijd</p>
          </div>
          <div className="checkedOut">
            <h1>{checkedOut}</h1>
            <p>Boeken uitgeleend</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
