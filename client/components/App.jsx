import React from 'react';
import Header from './Header';
import Contents from './Contents';

export default function () {
  const [activePage, setActivePage] = React.useState(0);

  return (
    <>
      <title>스마트 가로등</title>
      <Header activePage={activePage} setActivePage={setActivePage} />
      <Contents activePage={activePage} />
    </>
  )
}