import React from "react";
import "./header.css";

const Header: React.FC = () => {
  return (
    <header className="header">
      <h1>Pharmacy Name</h1>
      <nav>
        <ul>
          <li><a href="#services">Services</a></li>
          <li><a href="#about">About Us</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
