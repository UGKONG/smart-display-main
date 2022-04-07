import React from 'react';
import Styled from 'styled-components';
import Home from './Home';
import Device from './Device';
import Log from './Log';

export default function ({ activePage }) {
  return (
    <Contents>
      { activePage === 0 && <Home /> }
      { activePage === 1 && <Device /> }
      { activePage === 2 && <Log /> }
    </Contents>
  )
}

const Contents = Styled.section`
  width: 100%;
  height: calc(100% - 60px);
  overflow: auto;
`