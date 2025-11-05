import { useState, useEffect } from "react";
import "../../App.css";
import { getCookie, setTitle, post, Toast } from "../../functions";
import { useNavigate } from "react-router";
import TeacherNavbar from "../teacher/teacherNavbar";
import Toolbar from "../../components/Toolbar";
import { usePost, useMutatePost } from "../../hooks";
import { useQueryClient } from "@tanstack/react-query";

const ManageUsers = () => {
  setTitle("Gebruikers beheren");

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sessionId = getCookie("sessionId");

  // ✅ Cached query for all users
  const {
    data: users,
    isLoading,
    error,
    invalidate: refetchUsers,
  } = usePost("/allUsers", { sessionId }, "allUsers");

  // ✅ Mutations for fetching data on demand
  const { mutateAsync: fetchUser } = useMutatePost("allUsers");
  const { mutateAsync: fetchMaterial } = useMutatePost("allUsers");

  // ✅ UI states
  const [selectedUser, setSelectedUser] = useState(null);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [showAll, setShowAll] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState("name");
  const [sortDirection, setSortDirection] = useState("ascending");
  const [filter, setFilter] = useState("none");
  const [sortedClss, setSortedCllss] = useState([]);
  const [sortedReadingLvl, setSortedReadingLvl] = useState([]);
  const [sortedPrivs, setSortedprivs] = useState([]);

  // ✅ Populate derived filter/sort lists
  useEffect(() => {
    if (!users) return;
    setFilteredUsers(users);

    const readinglevels = Array.from(
      new Set(
        users.map((u) => u.readinglevel?.toLowerCase().trim()).filter(Boolean)
      )
    ).sort();
    const classes = Array.from(
      new Set(users.map((u) => u.class?.toLowerCase().trim()).filter(Boolean))
    ).sort();
    const privs = Array.from(new Set(users.map((u) => u.privilege))).sort();

    setSortedReadingLvl(readinglevels);
    setSortedCllss(classes);
    setSortedprivs(privs);
  }, [users]);

  // 🔎 Search
  const handleSearch = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    if (!users) return;
    const regex = new RegExp(query, "i");
    setFilteredUsers(
      users.filter(
        (u) =>
          regex.test(u.firstname) ||
          regex.test(u.lastname) ||
          regex.test(u.class)
      )
    );
  };

  // 🔽 Sorting
  const handleChangeSort = (event) => {
    const selectedSort = event.target.value;
    setSort(selectedSort);
    if (!filteredUsers) return;
    const sorted = [...filteredUsers].sort((a, b) => {
      const valA = a[selectedSort] ?? "";
      const valB = b[selectedSort] ?? "";
      return sortDirection === "ascending"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
    setFilteredUsers(sorted);
  };

  const handleChangeDirection = (event) => {
    const dir = event.target.value;
    setSortDirection(dir);
    if (!filteredUsers) return;
    const sorted = [...filteredUsers].sort((a, b) => {
      const valA = a[sort] ?? "";
      const valB = b[sort] ?? "";
      return dir === "ascending"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
    setFilteredUsers(sorted);
  };

  // 🔍 Filtering
  const handleChangeFilter = (event) => {
    const { selectedIndex, options } = event.currentTarget;
    const selectedOption = options[selectedIndex];
    const selectedFilter = selectedOption.value;
    const group = selectedOption.closest("optgroup")?.id;

    setFilter(selectedFilter);
    if (!users) return;

    let filtered = users;
    if (group === "class") {
      filtered = users.filter(
        (u) => u.class?.toLowerCase().trim() === selectedFilter
      );
    } else if (group === "readinglevel") {
      filtered = users.filter(
        (u) => u.readinglevel?.toLowerCase().trim() === selectedFilter
      );
    } else if (group === "privilege") {
      filtered = users.filter((u) => u.privilege === Number(selectedFilter));
    } else if (selectedFilter === "none") {
      filtered = users;
    }

    setFilteredUsers(filtered);
  };

  // 👤 Fetch and cache selected user + materials
  const handleSelect = async (user) => {
    // Try cache first
    let selected = queryClient.getQueryData(["user", user.userid]);
    if (!selected) {
      selected = await fetchUser({
        url: "/getUser",
        body: { sessionid: sessionId, userid: user.userid },
        key: ["user", user.userid],
      });
      queryClient.setQueryData(["user", user.userid], selected);
    }

    setSelectedUser(selected);
    setShowAll(false);

    const fetchCachedMaterial = async (materialId) => {
      const cacheKey = ["material", materialId];
      const cached = queryClient.getQueryData(cacheKey);
      if (cached) return cached.title;
      const data = await fetchMaterial({
        url: "/getMaterial",
        body: { sessionid: sessionId, materialid: materialId },
        key: cacheKey,
      });
      queryClient.setQueryData(cacheKey, data[0]);
      return data[0]?.title;
    };

    const history = await Promise.all(
      (user.history ?? []).map((e) => fetchCachedMaterial(e.material))
    );
    const materials = await Promise.all(
      (user.matrials ?? []).map((e) => fetchCachedMaterial(e.material))
    );

    setSelectedHistory(history);
    setSelectedMaterials(materials);
  };

  // ✏️ Navigation helpers
  const redirectToPage = (path) => navigate(path);
  const handlePw = (userid) => {
    document.cookie = "changePwUser=" + userid;
    redirectToPage("/beheer/verander-gebruiker-wachtwoord");
  };
  const handleChangeUser = () => {
    document.cookie = "changeUser=" + selectedUser.userid + ";path=/";
    redirectToPage("bewerken");
  };

  // ❌ Delete user
  const deleteUser = async (userId) => {
    if (!window.confirm("Weet u zeker dat u deze gebruiker wilt verwijderen?"))
      return;
    await post("/removeUser", { sessionId, userId });
    await refetchUsers();
    setToastMessage("Gebruiker succesvol verwijderd.");
    setToastType("success");
    setShowToast(true);
  };

  // 🕐 Loading/error states
  if (isLoading) return <div>Loading gebruikers...</div>;
  if (error) return <div>Fout bij ophalen gebruikers.</div>;

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
      <TeacherNavbar />
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
              options: sortedPrivs.map((p) => ({
                value: p,
                label:
                  p === 0 ? "Leerling" : p === 1 ? "Leerkracht" : "Beheerder",
              })),
            },
            {
              id: "class",
              label: "Klas",
              options: sortedClss.map((cls) => ({ value: cls, label: cls })),
            },
            {
              id: "readinglevel",
              label: "Niveau",
              options: sortedReadingLvl.map((lvl) => ({
                value: lvl,
                label: lvl,
              })),
            },
          ]}
        />

        <div>
          {showAll ? (
            <div className="itemList">
              {filteredUsers.map((user) => (
                <li
                  key={user.userid}
                  onClick={() => handleSelect(user)}
                  className="item"
                >
                  <h3>{user.firstname + " " + user.lastname}</h3>
                </li>
              ))}
            </div>
          ) : (
            <div>
              <h2>{selectedUser.firstname + " " + selectedUser.lastname}</h2>
              <p>Klas: {selectedUser.class}</p>
              <p>Klas nummer: {selectedUser.classnum}</p>

              <h3>Geschiedenis:</h3>
              {selectedHistory.length ? (
                selectedHistory.map((b, i) => <p key={i}>{b}</p>)
              ) : (
                <p>Geen geschiedenis</p>
              )}

              <h3>Boeken in bezit:</h3>
              {selectedMaterials.length ? (
                selectedMaterials.map((b, i) => <p key={i}>{b}</p>)
              ) : (
                <p>Geen boeken in bezit</p>
              )}

              <button
                onClick={() => handlePw(selectedUser.userid)}
                className="button"
              >
                Verander wachtwoord
              </button>
              <button
                onClick={() => deleteUser(selectedUser.userid)}
                className="button"
              >
                Verwijder gebruiker
              </button>
              <button onClick={handleChangeUser} className="button">
                Bewerk gebruiker
              </button>
              <button onClick={() => setShowAll(true)} className="button">
                Terug naar alle gebruikers
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;
