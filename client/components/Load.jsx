import React from 'react';
import Styled from 'styled-components';

export default function () {
  return (
    <Container>
      <Load />
    </Container>
  )
}

const Container = Styled.section`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;
const Load = Styled.div`
  width: 100px;
  height: 100px;
  border-radius: 100px;
  position: relative;
  animation: rotation infinite 1.2s linear;
  background: conic-gradient(#777777 0%, #77777700 80%);

  &::after {
    content: '';
    width: 92%;
    height: 92%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background-color: #333;
  }

  @keyframes rotation {
    0% { transform: rotate(0deg) }
    100% { transform: rotate(360deg) }
  }
`;