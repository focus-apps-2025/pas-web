// src/App.js
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard from "./pages/admindashboard";
import UserManagement from './pages/usermangement/usermanagement_screen';
import TeamManagement from './pages/teammanagement/teammanagement_screen';
import CreateEditTeam from './pages/teammanagement/create_edit_team';
import ViewRackDetails from "./pages/teammanagement/View_rack";
import EditRackScreen from "./pages/teammanagement/edit_rack";
import MasterDescription from "./pages/masterdesc/MasterDescription";
import Report from "./pages/Report/final_report"; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/teams" element={<TeamManagement />} />
        <Route path="/admin/teams/create" element={<CreateEditTeam />} />
        <Route path="/admin/teams/edit/:teamId" element={<CreateEditTeam />} />
        <Route path="/admin/teams/:teamId/racks" element={<ViewRackDetails/>} />
        <Route path="/racks/:rackId/edit" element={<EditRackScreen />} />
        <Route path="/admin/master-desc" element={<MasterDescription />} />
        <Route path="/admin/reports" element={<Report />} />
        <Route path="/" element={<Navigate to="/admin" />} />
        <Route path="*" element={<Navigate to="/admin" />} /> 
      </Routes>
    </BrowserRouter>
  );
}
export default App;