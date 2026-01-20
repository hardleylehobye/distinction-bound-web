import React, { useState, useEffect } from 'react';
import './App.css';
import './testFirestoreConnection'; // Run connection test on app load

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Courses from './pages/Courses';
import Contact from './pages/Contact';
import LoginPortal from './pages/StudentPortal';
import AdminPortal from './pages/AdminPortal';
import InstructorPortal from './pages/InstructorPortal';
import FinancePortal from './pages/FinancePortal';
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
      // Check for redirect result (for mobile devices)
      const redirectResult = await handleRedirectResult();
      
      if (redirectResult) {
        handleLogin(redirectResult);
        return;
      }

      // Load existing session
      const user = localStorage.getItem('distinctionBoundUser');
      const account = localStorage.getItem('distinctionBoundAccountRole');
      const active = localStorage.getItem('distinctionBoundActiveRole');

      if (user && account && active) {
        const userData = JSON.parse(user);
        console.log("✓ Session restored:", userData.email, `(${userData.role})`);
        setCurrentUser(userData);
        setAccountRole(account);
        setActiveRole(active);

        if (active === 'admin') setCurrentPage('admin-portal');
        else if (active === 'instructor') setCurrentPage('instructor-dashboard');
        else setCurrentPage('student-portal-dashboard');
      }
    };

    checkAuthResult();
  }, []);

  // LOGIN HANDLER (called after Firebase login)
  const handleLogin = (userData) => {
    console.log("✓ Login successful:", userData.email, `(${userData.role})`);
    
    setCurrentUser(userData);
    setAccountRole(userData.role);
    setActiveRole(userData.role);

    localStorage.setItem('distinctionBoundUser', JSON.stringify(userData));
    localStorage.setItem('distinctionBoundAccountRole', userData.role);
    localStorage.setItem('distinctionBoundActiveRole', userData.role);

    if (userData.role === 'student' || !userData.role) {
      // New users (no role) and students go directly to student dashboard
      setCurrentPage('student-portal-dashboard');
    } else {
      // Admin and instructor go to role selection
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
        return <About setCurrentPage={setCurrentPage} />;

      case 'courses':
        return <Courses userRole={activeRole} currentUser={currentUser} setCurrentPage={setCurrentPage} />;

      case 'contact':
        return <Contact setCurrentPage={setCurrentPage} />;

      case 'login':
        // If already logged in, redirect to appropriate portal
        if (currentUser && activeRole) {
          if (activeRole === 'student') return renderPage.call(this, 'student-portal');
          if (activeRole === 'admin') return renderPage.call(this, 'admin-portal');
          if (activeRole === 'instructor') return renderPage.call(this, 'instructor-dashboard');
        }
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

      case 'student-portal':
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

      case 'finance-portal':
        if (accountRole !== 'admin') return <Home />;
        return (
          <FinancePortal
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
