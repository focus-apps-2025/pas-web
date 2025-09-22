// src/App.js
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard from "./pages/admindashboard";
import UserManagement from './pages/usermangement/usermanagement_screen';
import TeamManagement from './pages/teammanagement/teammanagement_screen';
import MasterDescription from "./pages/masterdesc/MasterDescription";
import Report from "./pages/Report/final_report"; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/teams" element={<TeamManagement />} />
        <Route path="/admin/master-desc" element={<MasterDescription />} />
        <Route path="/admin/reports" element={<Report />} />
        <Route path="/" element={<Navigate to="/admin" />} />
        <Route path="*" element={<Navigate to="/admin" />} /> 
      </Routes>
    </BrowserRouter>
  );
}
export default App;