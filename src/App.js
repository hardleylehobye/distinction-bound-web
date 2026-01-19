import React, { useState, useEffect } from 'react';
import './App.css';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Courses from './pages/Courses';
import Contact from './pages/Contact';
import LoginPortal from './pages/StudentPortal';
import AdminPortal from './pages/AdminPortal';
import InstructorPortal from './pages/InstructorPortal';
import CourseManagementSystem from './components/CourseManagementSystem';
import ChooseRole from './pages/ChooseRole';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Auth
import { handleRedirectResult } from './authService';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [currentUser, setCurrentUser] = useState(null);

  // 🔑 TWO ROLES
  const [accountRole, setAccountRole] = useState(null); // real role
  const [activeRole, setActiveRole] = useState(null);   // selected view

  // Load session and handle redirect result
  useEffect(() => {
    const checkAuthResult = async () => {
      console.log("App: Checking authentication result...");
      
      // Check for redirect result (for mobile devices)
      const redirectResult = await handleRedirectResult();
      console.log("App: Redirect result:", redirectResult);
      
      if (redirectResult) {
        console.log("App: Handling redirect result login");
        handleLogin(redirectResult);
        return;
      }

      // Load existing session
      console.log("App: Loading existing session...");
      const user = localStorage.getItem('distinctionBoundUser');
      const account = localStorage.getItem('distinctionBoundAccountRole');
      const active = localStorage.getItem('distinctionBoundActiveRole');

      console.log("App: Session data:", { user: !!user, account, active });

      if (user && account && active) {
        const userData = JSON.parse(user);
        console.log("App: Setting existing user session:", userData.role);
        setCurrentUser(userData);
        setAccountRole(account);
        setActiveRole(active);

        if (active === 'admin') setCurrentPage('admin-portal');
        else if (active === 'instructor') setCurrentPage('instructor-dashboard');
        else setCurrentPage('student-portal-dashboard');
      } else {
        console.log("App: No existing session found");
      }
    };

    checkAuthResult();
  }, []);

  // LOGIN HANDLER (called after Firebase login)
  const handleLogin = (userData) => {
    console.log("App: Handling login for user:", userData.email, "Role:", userData.role);
    
    setCurrentUser(userData);
    setAccountRole(userData.role);
    setActiveRole(userData.role);

    localStorage.setItem('distinctionBoundUser', JSON.stringify(userData));
    localStorage.setItem('distinctionBoundAccountRole', userData.role);
    localStorage.setItem('distinctionBoundActiveRole', userData.role);

    console.log("App: Login data saved to localStorage");

    if (userData.role === 'student' || !userData.role) {
      // New users (no role) and students go directly to student dashboard
      console.log("App: Redirecting to student portal dashboard");
      setCurrentPage('student-portal-dashboard');
    } else {
      // Admin and instructor go to role selection
      console.log("App: Redirecting to role selection");
      setCurrentPage('choose-role');
    }
  };

  // LOGOUT
  const handleLogout = () => {
    setCurrentUser(null);
    setAccountRole(null);
    setActiveRole(null);
    localStorage.clear();
    setCurrentPage('home');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home setCurrentPage={setCurrentPage} />;

      case 'about':
        return <About />;

      case 'courses':
        return <Courses userRole={activeRole} currentUser={currentUser} />;

      case 'contact':
        return <Contact />;

      case 'login':
        return (
          <LoginPortal
            onLogin={handleLogin}
            setCurrentPage={setCurrentPage}
          />
        );

      case 'choose-role':
        return (
          <ChooseRole
            accountRole={accountRole}
            setActiveRole={setActiveRole}
            setCurrentPage={setCurrentPage}
          />
        );

      case 'student-portal-dashboard':
        return (
          <LoginPortal
            currentUser={currentUser}
            onLogout={handleLogout}
            setCurrentPage={setCurrentPage}
          />
        );

      case 'instructor-dashboard':
        if (accountRole === 'student') return <Home />;
        return (
          <InstructorPortal
            currentUser={currentUser}
            onLogout={handleLogout}
            setCurrentPage={setCurrentPage}
          />
        );

      case 'admin-portal':
        if (accountRole !== 'admin') return <Home />;
        return (
          <AdminPortal
            currentUser={currentUser}
            onLogout={handleLogout}
            setCurrentPage={setCurrentPage}
          />
        );

      case 'manage-courses':
        return (
          <CourseManagementSystem
            userRole={activeRole}
            currentUser={currentUser}
            onBack={() => setCurrentPage('instructor-dashboard')}
            onLogout={handleLogout}
          />
        );

      default:
        return <Home setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="App">
      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        userRole={activeRole}
      />
      <main>{renderPage()}</main>
      <Footer setCurrentPage={setCurrentPage} />
    </div>
  );
}

export default App;
