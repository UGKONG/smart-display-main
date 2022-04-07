import React from 'react';
import Styled from 'styled-components';
import logo from '../logo.png';
import { NavLink } from 'react-router-dom';

export default function () {
  const menuList = React.useRef([
    { id: 0, name: 'HOME', to: '/' },
    { id: 1, name: 'DEVICE', to: '/device' },
    { id: 2, name: 'LOG', to: '/log' },
  ]);

  return (
    <Header>
      <Logo src={logo} alt="logo" />
      <BtnContainer>
        {menuList.current.map(item => (
          <NavLink to={item.to} key={item.id} active-class-name={'active'}>
            {item.name}
          </NavLink>
        ))}
      </BtnContainer>
    </Header>
  )
}

const Header = Styled.header`
  width: 100%;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 10px;
  
  @media screen and (max-width: 500px) {
    height: 100px;
    flex-direction: column;
  }
`;
const Logo = Styled.img`
  height: 35px;

  @media screen and (max-width: 500px) {
    height: 31px;
    margin: 10px 0;
  }
`;
const BtnContainer = Styled.div`
  height: 100%;
  padding: 0 10px;
  display: flex;
  align-items: center;

  & > a {
    padding: 8px 14px;
    background-color: transparent;
    border: none;
    border-radius: 3px;
    margin-left: 10px;

    &:hover {
      background-color: #aaaaaa30;
    }
    &:active {
      background-color: #aaaaaa50;
    }
    &.active {
      background-color: #fff;
      color: #333;
    }
  }
`;