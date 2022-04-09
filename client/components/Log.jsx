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
            <List key={item.ID}>
              <Date>{item.DATE_TIME}</Date>
              <Ip>{item.IP}</Ip>
              <Text>{item.DESCRIPTION}</Text>
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
  background-color: #666;
  border-radius: 8px;
  padding: 10px;
`;
const Date = Styled.span`
  margin-right: 10px;
`;
const Ip = Styled.span``;
const Text = Styled.p``;