import React from 'react';
import Header from './Header';
import Contents from './Contents';
import { HashRouter } from 'react-router-dom';

export default function () {
  return (
    <HashRouter>
      <Header />
      <Contents />
    </HashRouter>
  )
}