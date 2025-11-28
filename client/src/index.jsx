//css
import "./App.css";
//react
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

//pages
import App from "./App";
import NoPage from "./pages/NoPage";
import StudentLogin from "./pages/student/studentLogin";
import TeacherLogin from "./pages/teacher/teacherLogin";
import Dashboard from "./pages/teacher/teacherDashboard";
import TeacherLib from "./pages/teacher/teacherLibrary";
import AddUser from "./pages/admin/addUser";
import UserTyperChoise from "./pages/userTypeChoise";
import AddMaterial from "./pages/admin/addMaterial";
import StudentLib from "./pages/student/studentLibrary";
import ManageUsers from "./pages/admin/manageUsers";
import TeacherChangePassword from "./pages/teacher/teacherChangePassword";
import StudentChangePassword from "./pages/student/studentChangePassword";
import ChangeUserPass from "./pages/admin/changeUserPass";
import ManageMaterials from "./pages/admin/manageMaterial";
import ReturnBooks from "./pages/student/return";
import Pupils from "./pages/teacher/teacherPupils";
import TeacherChangeUser from "./pages/teacher/teacherChangeUsers";
import JsonImport from "./pages/admin/jsonimport";
import ChangeMaterial from "./pages/admin/changeBook";
import AdminChangeUser from "./pages/admin/adminChangeUsers";

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<UserTyperChoise />} />
          <Route path="*" element={<NoPage />} />
          <Route path="leerling" element={<StudentLogin />} />
          <Route path="leerkracht-login" element={<TeacherLogin />} />

          <Route path="leerkracht/overzicht" element={<Dashboard />} />
          <Route path="leerkracht/bibliotheek" element={<TeacherLib />} />
          <Route
            path="leerkracht/verander-wachtwoord"
            element={<TeacherChangePassword />}
          />
          <Route path="leerkracht/leerlingen" element={<Pupils />} />
          <Route
            path="leerkracht/leerlingen/bewerken"
            element={<TeacherChangeUser />}
          />

          <Route path="beheer/gebruiker-toevoegen" element={<AddUser />} />
          <Route path="beheer/gebruikers-beheren" element={<ManageUsers />} />
          <Route path="beheer/boek-toevoegen" element={<AddMaterial />} />
          <Route
            path="beheer/verander-gebruiker-wachtwoord"
            element={<ChangeUserPass />}
          />
          <Route path="beheer/boeken-beheren" element={<ManageMaterials />} />
          <Route path="beheer/json-upload" element={<JsonImport />} />
          <Route
            path="beheer/boeken-beheren/bewerken"
            element={<ChangeMaterial />}
          />
          <Route
            path="beheer/gebruikers-beheren/bewerken"
            element={<AdminChangeUser />}
          />

          <Route path="leerling/bibliotheek" element={<StudentLib />} />
          <Route
            path="leerling/verander-wachtwoord"
            element={<StudentChangePassword />}
          />
          <Route path="leerling/lever-in" element={<ReturnBooks />} />
        </Route>
      </Routes>
    </BrowserRouter>  
  </QueryClientProvider>
);
