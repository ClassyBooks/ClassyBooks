import "../../App.css";
import TeacherNavbar from "./teacherNavbar";
import { getCookie } from "../../functions";
import { useEffect, useState } from "react";
import { usePost } from "../../hooks";

const Dashboard = () => {
  const [students, setStudents] = useState(0);
  const [studentBooks, setStudentBooks] = useState(0);
  const [checkedOut, setCheckedOut] = useState(0);
  const [overdue, setOverdue] = useState(0);

  const books = usePost("/allMaterials", {}, "allMaterials");
  const users = usePost(
    "/allUsers",
    { sessionId: getCookie("sessionId") },
    "allUsers"
  );

  useEffect(() => {
    if (!books.isLoading) {
      countCheckedOut(books.data);
      countOverdue(books.data);
    }

    if (!users.isLoading) {
      countStudents(users.data);
      countStudentBooks(users.data);
    }
  }, [users, books]);

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
            <h1>{books?.data?.length}</h1>
            <p>boeken</p>
          </div>
          <div className="students">
            <h1>{users?.data?.length}</h1>
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
