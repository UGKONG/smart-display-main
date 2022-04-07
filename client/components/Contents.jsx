import React from 'react';
import Styled from 'styled-components';
import Home from './Home';
import Device from './Device';
import Log from './Log';
import { Routes, Route } from 'react-router-dom';

export default function () {
  return (
    <Contents>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/device' element={<Device />} />
        <Route path='/log' element={<Log />} />
      </Routes>
    </Contents>
  )
}

const Contents = Styled.section`
  width: 100%;
  height: calc(100% - 60px);
  overflow: auto;
  padding: 10px;

  @media screen and (max-width: 500px) {
    height: calc(100% - 100px);
  }
`