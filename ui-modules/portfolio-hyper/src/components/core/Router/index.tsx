import HomePage from '/src/pages/HomePage'
import SecondaryPage from '/src/pages/SecondaryPage'
import CounterPage from '/src/pages/CounterPage'
import PortfolioPage from '/src/pages/PortfolioPage'
import NotFoundPage from '/src/pages/NotFoundPage'

const Router = (state) => {
  if (state.location.path === '/') {
    return <HomePage {...state} />
  }
  if (state.location.path === '/secondary') {
    return <SecondaryPage {...state} />
  }
  if (state.location.path === '/counter') {
    return <CounterPage {...state} />
  }
  if (state.location.path === '/portfolio') {
    return <PortfolioPage {...state} />
  }
  return <NotFoundPage />
}

export default Router
