import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../style/navbar.css';

const Navbar = () => {

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="logo-link">
                    <div className="nav-left">
                        <Link to="/" className="navbar-logo">
                        Cafe and Food Review
                        </Link>
                    </div>
                    
                    <ul className="nav-menu">
                        <li className="nav-item">
                            <Link to="/Browse" className="nav-links">
                                Browse
                            </Link>
                        </li>
                        
                        <li className="nav-item dropdown">
                            <span className="nav-links dropdown-toggle">
                                For You
                            </span>
                            <ul className="dropdown-menu">
                                <li>
                                    <Link to="/for-you" className="dropdown-link">
                                        For You
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/most-like" className="dropdown-link">
                                        Most Like
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/top-5" className="dropdown-link">
                                        Top 5
                                    </Link>
                                </li>
                            </ul>
                        </li>
                        
                        <li className="nav-item dropdown">
                            <span className="nav-links dropdown-toggle">
                                Regions 
                            </span>
                            <ul className="dropdown-menu">
                                <li>
                                    <Link to="/category/1" className="dropdown-link">
                                        North
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/category/2" className="dropdown-link">
                                        East
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/category/3" className="dropdown-link">
                                        South
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/category/4" className="dropdown-link">
                                        West
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/category/5" className="dropdown-link">
                                        Central
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/category/6" className="dropdown-link">
                                        Isaan
                                    </Link>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </div>

                <div className="login-signup">
                    <Link to="/login" className="nav-login-button">
                        Login
                    </Link>
                    <Link to="/signup" className="nav-signup-button">
                        Sign Up
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;