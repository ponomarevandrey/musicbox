import React, { Component } from "react";

import { MusicboxLogo } from "../musicbox-logo/musicbox-logo";
import { Btn } from "../btn/btn";
import { SearchBar } from "../search-bar/search-bar";
import "./app-header.scss";

interface Props {
  className?: string;
}

export function AppHeader(props: Props) {
  const { className = "" } = props;

  return (
    <header className={`app-header ${className}`}>
      <MusicboxLogo className="app-header__logo" fill="white" height="1.5rem" />
      <SearchBar className="app-header__search-bar" />
      <nav className="app-header__controls app-header__controls_top">
        <Btn to="/release/add">Add Release</Btn>
      </nav>
    </header>
  );
}
