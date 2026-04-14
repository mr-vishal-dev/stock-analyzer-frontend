import { useState, useEffect } from 'react'
import './App.css'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import DetailsPage from './pages/DetailsPage'
import { fetchSavedStocks, saveStock } from './api'

function App() {
  const [page, setPage] = useState('dashboard')
  const [selectedStock, setSelectedStock] = useState(null)
  const [savedStocks, setSavedStocks] = useState([])
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark'
    return window.localStorage.getItem('taurusTheme') || 'dark'
  })
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null
    try {
      return JSON.parse(window.localStorage.getItem('taurusAuthUser')) || null
    } catch {
      return null
    }
  })

  useEffect(() => {
    window.localStorage.setItem('taurusTheme', theme)
  }, [theme])

  useEffect(() => {
    document.body.classList.remove('dark-theme', 'light-theme')
    document.body.classList.add(`${theme}-theme`)
  }, [theme])

  useEffect(() => {
    if (!user?.email) {
      setSavedStocks([])
      return
    }

    const loadSaved = async () => {
      try {
        const stocks = await fetchSavedStocks(user.email)
        setSavedStocks(Array.isArray(stocks) ? stocks : [])
      } catch (error) {
        console.error('Failed to load saved stocks:', error)
        setSavedStocks([])
      }
    }

    loadSaved()
  }, [user])

  const handleSelectStock = (symbol, name) => {
    setSelectedStock({ symbol, name })
    setPage('details')
  }

  const handleSaveStock = async (stockItem) => {
    if (!stockItem || !stockItem.symbol) return

    const currentSaved = Array.isArray(savedStocks) ? savedStocks : []
    const nextSaved = [stockItem, ...currentSaved.filter((stock) => stock.symbol !== stockItem.symbol)].slice(0, 10)
    setSavedStocks(nextSaved)

    if (!user?.email) return

    try {
      await saveStock(user.email, stockItem)
    } catch (error) {
      console.error('Failed to sync saved stock:', error)
    }
  }

  const handleBack = () => {
    setPage('dashboard')
  }

  const handleThemeToggle = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  const normalizeUser = (authenticatedUser) => ({
    ...authenticatedUser,
    name: authenticatedUser.user_name || authenticatedUser.name,
    email: authenticatedUser.user_email || authenticatedUser.email,
    saved_stocks: authenticatedUser.saved_stocks || [],
  })

  const handleAuthenticate = (authenticatedUser) => {
    const normalized = normalizeUser(authenticatedUser)
    setUser(normalized)
    window.localStorage.setItem('taurusAuthUser', JSON.stringify(normalized))
  }

  const handleLogout = () => {
    setUser(null)
    setSavedStocks([])
    window.localStorage.removeItem('taurusAuthUser')
    setPage('dashboard')
  }

  return (
    <div className={`app-shell ${theme}-theme`}>
      {!user ? (
        <AuthPage onAuthenticate={handleAuthenticate} />
      ) : (
        page === 'dashboard' ? (
          <Dashboard
            onSelectStock={handleSelectStock}
            savedStocks={savedStocks}
            theme={theme}
            onThemeToggle={handleThemeToggle}
            user={user}
            onLogout={handleLogout}
          />
        ) : (
          selectedStock && (
            <DetailsPage
              symbol={selectedStock.symbol}
              name={selectedStock.name}
              onBack={handleBack}
              onSaveStock={handleSaveStock}
            />
          )
        )
      )}
    </div>
  )
}

export default App
