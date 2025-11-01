import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { ScrollToTop } from '../components/ScrollToTop';
import Home from '../features/Home';
import Canvas from '../features/Canvas';
import Events from '../features/Events';
// import About from '../features/About';
import Users from '../features/Users';
import { Invites } from '../features/Invites';
import ErrorBoundary from '../components/ErrorBoundary';

function App(): JSX.Element {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path='/' element={<Layout />}>
            <Route index element={<Home />} />
            <Route
              path='canvas'
              element={
                <ErrorBoundary>
                  <Canvas />
                </ErrorBoundary>
              }
            />
            <Route
              path='events'
              element={
                <ErrorBoundary>
                  <Events />
                </ErrorBoundary>
              }
            />
            {/* <Route path='about' element={<About />} /> */}
            <Route path='users' element={<Users />} />
            <Route path='invites' element={<Invites />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
