import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { PlanPage } from './pages/PlanPage'
import { ReflectPage } from './pages/ReflectPage'
import { NotesPage } from './pages/NotesPage'
import { ExplorePage } from './pages/ExplorePage'
import { MapPage } from './pages/MapPage'
import { ProfilePage } from './pages/ProfilePage'
import { TripPage } from './pages/TripPage'
import { AuthPage } from './pages/AuthPage'
import { PublishPage } from './pages/PublishPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/reflect" element={<ReflectPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/publish" element={<PublishPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/trip/:id" element={<TripPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
