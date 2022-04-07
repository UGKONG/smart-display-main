import axios from 'axios';
import React from 'react';
import Styled from 'styled-components';

export default function () {
  const [list, setList] = React.useState([]);

  const GET = () => {
    axios.get('/api/log').then(({ data }) => {
      setList(data);
    });
  }

  React.useEffect(() => {
    GET();
    setInterval(() => GET(), 300000);
  }, []);

  return (
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
  )
}

const Log = Styled.ul`
  padding: 10px;
`;
const List = Styled.li`
  margin-bottom: 10px; 
  font-size: 14px; 
  
`;
const Ip = Styled.p`
  
`;
const Text = Styled.p`
  
`;