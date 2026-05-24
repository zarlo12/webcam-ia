import React from 'react';
import './Home.scss';
import oxxoLogo from '../../assets/Oxxo_Logo.svg';

interface HomeProps {
  onStart: () => void;
}

const Home: React.FC<HomeProps> = ({ onStart }) => (
  <div className="home">
    <div className="home__logo-area">
      <img src={oxxoLogo} alt="OXXO" className="home__logo" />
    </div>

    <div className="home__content">
      <h1 className="home__title">
        Crea tu<br />avatar<br />futbolero
      </h1>
      <p className="home__subtitle">
        Tómate una foto y comparte<br />tu versión futbolera
      </p>
    </div>

    <div className="home__cta">
      <button className="pill-btn" onClick={onStart}>
        Tomar foto
      </button>
    </div>
  </div>
);

export default Home;
