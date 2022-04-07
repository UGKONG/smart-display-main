import React from 'react';
import Styled from 'styled-components';
import logo from '../logo.png';

export default function ({ activePage, setActivePage }) {
  const menuList = React.useRef([
    { id: 0, name: 'HOME' },
    { id: 1, name: 'DEVICE' },
    { id: 2, name: 'LOG' },
  ]);
  const clickMenu = id => setActivePage(id);

  return (
    <Header>
      <Logo src={logo} alt="logo" />
      <BtnContainer>
        {
          menuList.current.map(item => (
            <button 
              className={activePage === item.id ? 'active': ''}
              onClick={() => clickMenu(item.id)}
              key={item.id}
            >{item.name}</button>
          ))
        }
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
`;
const Logo = Styled.img`
  height: 70%;
`;
const BtnContainer = Styled.div`
  height: 100%;
  padding: 0 10px;
  display: flex;
  align-items: center;

  & > button {
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