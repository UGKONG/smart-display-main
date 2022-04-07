import React from 'react';
import Header from './Header';
import Contents from './Contents';
import { HashRouter } from 'react-router-dom';

export default function () {
  const [activePage, setActivePage] = React.useState(0);

  return (
    <HashRouter>
      <Header activePage={activePage} setActivePage={setActivePage} />
      <Contents activePage={activePage} />
    </HashRouter>
  )
}