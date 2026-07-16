import './App.css'
import roxasImg from './assets/roxas.png'
import logoimg from './assets/logo.png'

function App() {
  return (
    <>
      <section id="center">
        <div>
          <img src={logoimg} alt="logo" width="150" height="150"></img>
          <h1>WELCOME</h1>
          <h3>TO ATENEO FOOD GUIDE</h3>
          <img src={roxasImg} alt="map" width="400" height="300"></img>
        </div>
      </section>

      <div className="ticks"></div>
      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
