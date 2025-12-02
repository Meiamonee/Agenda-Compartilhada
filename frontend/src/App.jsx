import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import RegisterChoice from "./pages/RegisterChoice";
import RegisterCompany from "./pages/RegisterCompany";
import RegisterEmployee from "./pages/RegisterEmployee";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";

function PrivateRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));
  return user ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<RegisterChoice />} />
        <Route path="/register/company" element={<RegisterCompany />} />
        <Route path="/register/employee" element={<RegisterEmployee />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <PrivateRoute>
              <Dashboard initialView="calendar" />
            </PrivateRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <PrivateRoute>
              <Employees />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}
