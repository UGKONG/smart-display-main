import axios from 'axios';
import React from 'react';
import Styled from 'styled-components';
import Load from './Load';

export default function () {
  const [list, setList] = React.useState([]);
  const [isLoad, setIsLoad] = React.useState(true);

  const GET = () => {
    axios.get('/api/log').then(({ data }) => {
      setList(data);
      setIsLoad(false);
    });
  }

  React.useEffect(() => {
    GET();
    setInterval(() => GET(), 300000);
  }, []);

  return (
    <>
      <title>스마트 가로등 :: 로그</title>
      <Log>
        {
          list.map(item => (
            <List key={item.id}>
              <Date>{item.dateTime}</Date>
              <Ip>{item.ip}</Ip>
              <Text>{item.desc}</Text>
            </List>
          ))
        }
      </Log>
      { isLoad && <Load /> }
    </>
  )
}

const Log = Styled.ul`
  position: relative;
`;
const List = Styled.li`
  margin-bottom: 10px; 
  font-size: 14px;
`;
const Ip = Styled.p``;
const Text = Styled.p``;