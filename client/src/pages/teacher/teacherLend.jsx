import { useState, useEffect } from "react";
import "../../App.css";
import { getCookie, post, setTitle } from "../../functions";
import TeacherNavbar from "../teacher/teacherNavbar";
import { useNavigate } from "react-router-dom";
import Toolbar from "../../components/Toolbar";
import { usePost } from "../../hooks";

const TeacherLend = () => {
  const navigate = useNavigate();

  const redirectToPage = (path) => {
    navigate(path); // Use navigate to go to the specified path
  };
  setTitle("Uitlenen");

  const [selectedUser, setSelectedUser] = useState(null);
  const [sort, setSort] = useState("name");
  const [sortDirection, setSortDirection] = useState("ascending");
  const [filter, setFilter] = useState("none");
  const [sortedClss, setSortedCllss] = useState([]);
  const [sortedReadingLvl, setSortedReadingLvl] = useState([]);
  const [filterdUsers, setFilterdUsers] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (event) => {
    const query = event.target.value.toLowerCase();

    setSearchQuery(query);

    const regex = new RegExp(query, "i");

    const searchedUsers = users.filter(
      (user) =>
        regex.test(user?.firstname) ||
        regex.test(user?.class) ||
        regex.test(user?.lastname)
    );

    setFilterdUsers(searchedUsers);
  };

  const users = usePost(
    "/api/allUsers",
    { sessionId: getCookie("sessionId") },
    "allUsers"
  );

  useEffect(() => {
    if (users.data && !users.isLoading) {
      const specifiedUsers = users?.data?.filter(function (user) {
        return user.privilege === 0;
      });
      setFilterdUsers(specifiedUsers);

      let readinglevels = [];
      specifiedUsers?.map((user) => {
        if (!readinglevels.includes(user.readinglevel?.toLowerCase().trim())) {
          readinglevels = [
            ...readinglevels,
            user.readinglevel?.toLowerCase().trim(),
          ];
        }
      });
      readinglevels.sort();
      setSortedReadingLvl(readinglevels);

      let allClss = [];
      specifiedUsers?.map((user) => {
        if (!allClss.includes(user.class?.toLowerCase().trim())) {
          allClss = [...allClss, user.class?.toLowerCase().trim()];
        }
      });
      allClss.sort();
      setSortedCllss(allClss);
    }
  }, [users]);


  async function LendTo(user) {
    const userid = getCookie("userId")
    const pupilid = user.userid
    const materialid = getCookie("lendMaterial")

    console.log('lendto')


    const resp = await post("/api/teacherLendForStudent", { materialid, userid, pupilid, sessionid: getCookie("sessionId") });
    console.log(await resp)
    const timeString = new Date(resp)
    if (timeString == 'Invalid Date') {
      alert("Er is iets misgegaan bij het uitlenen van het materiaal.");
    } else {
      redirectToPage("/leerkracht/bibliotheek");
    }
  }

  if (!users) {
    return <div>Loading...</div>;
  }

  const handleChangeSort = (event) => {
    const selectedSort = event.target.value;
    const selectedDirection = sortDirection;
    setSort(selectedSort);

    const sortedUsers = [...users].sort((a, b) => {
      if (selectedDirection === "ascending") {
        if (a[selectedSort] < b[selectedSort]) return -1;
        if (a[selectedSort] > b[selectedSort]) return 1;
        return 0;
      } else if (selectedDirection === "descending") {
        if (a[selectedSort] > b[selectedSort]) return -1;
        if (a[selectedSort] < b[selectedSort]) return 1;
        return 0;
      }
    });

    setFilterdUsers(sortedUsers);
  };

  const handleChangeDirection = (event) => {
    const selectedSort = sort; // Get the currently selected sort key
    const selectedDirection = event.target.value; // Get the newly selected sort direction

    setSortDirection(selectedDirection); // Update the sort direction

    const sortedUsers = [...users].sort((a, b) => {
      if (selectedDirection === "ascending") {
        if (a[selectedSort] < b[selectedSort]) return -1;
        if (a[selectedSort] > b[selectedSort]) return 1;
        return 0;
      } else if (selectedDirection === "descending") {
        if (a[selectedSort] > b[selectedSort]) return -1;
        if (a[selectedSort] < b[selectedSort]) return 1;
        return 0;
      }
    });

    setFilterdUsers(sortedUsers);
  };

  const handleChangeFilter = (event) => {
    const { selectedIndex, options } = event.currentTarget;
    const selectedOption = options[selectedIndex];
    const selectedFilter = selectedOption.value;
    const selectedFilterGroup = selectedOption.closest("optgroup")?.id;

    setFilter(selectedFilter);
    if (selectedFilterGroup === "class") {
      const selectedFilterUsers = users.filter((user) =>
        user.class?.toLowerCase().trim().includes(selectedFilter)
      );
      setFilterdUsers(selectedFilterUsers);
    }
    if (selectedFilterGroup === "readinglevel") {
      const selectedFilterUsers = users.filter((user) =>
        user.readinglevel?.toLowerCase().trim().includes(selectedFilter)
      );
      setFilterdUsers(selectedFilterUsers);
    }

    if (selectedFilter === "none") setFilterdUsers(users);
  };


  return (
    <div>
      <nav>
        <TeacherNavbar />
      </nav>
      <div className="content">
        <Toolbar
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          searchLabel="Naam of klas"
          sort={sort}
          sortDirection={sortDirection}
          filter={filter}
          onSortChange={handleChangeSort}
          onSortDirectionChange={handleChangeDirection}
          onFilterChange={handleChangeFilter}
          sortOptions={[
            { value: "name", label: "Naam" },
            { value: "class", label: "Klas" },
            { value: "lastname", label: "Achternaam" },
          ]}
          filterOptions={[
            {
              id: "privilege",
              label: "Gebruikerstype",
              options: [
                { value: "0", label: "Leerling" },
                { value: "1", label: "Leerkracht" },
                { value: "2", label: "Beheerders" },
              ],
            },
            {
              id: "class",
              label: "Klas",
              options: sortedClss.map((cls) => ({ value: cls, label: cls })),
            },
            {
              id: "readinglevel",
              label: "Niveau",
              options: sortedReadingLvl.map((level) => ({
                value: level,
                label: level,
              })),
            },
          ]}
        />
        <div className="itemList">
          {filterdUsers.map((user) => (
            <li
              key={user.userid}
              onClick={() => {
                LendTo(user);
              }}
              className="item"
            >
              <h3>{user.firstname + " " + user.lastname}</h3>
            </li>
          ))
          }
        </div>
      </div>
    </div>
  );
};

export default TeacherLend;
