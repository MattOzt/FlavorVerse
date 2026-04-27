import {Navigate, Route, Routes} from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Recipes from './pages/Recipes'
import RecipeDetail from './pages/RecipeDetail'
import CreateRecipe from './pages/CreateRecipe'
import Profile from './pages/Profile'
import ShoppingList from './pages/ShoppingList'
import About from './pages/About'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'

function App() {
  return (
    <div className="min-h-screen bg-bg text-white">
      <Navbar/>
      <main className="mx-auto w-full max-w-[1400px] px-5 py-10 sm:px-8 lg:px-10">
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/about" element={<About/>}/>
          <Route path="/recipes" element={<Recipes/>}/>
          <Route path="/recipes/:id" element={<RecipeDetail/>}/>

          {/* protected routes - need to be logged in */}
          <Route path="/create" element={
            <ProtectedRoute><CreateRecipe/></ProtectedRoute>
          }/>
          <Route path="/profile" element={
            <ProtectedRoute><Profile/></ProtectedRoute>
          }/>
          <Route path="/shopping-list" element={
            <ProtectedRoute><ShoppingList/></ProtectedRoute>
          }/>

          <Route path="/login" element={<Login/>}/>
          <Route path="/register" element={<Register/>}/>
          <Route path="*" element={<NotFound/>}/>
          <Route path="/home" element={<Navigate to="/" replace/>}/>
        </Routes>
      </main>
      <Footer/>
    </div>
  )
}

export default App