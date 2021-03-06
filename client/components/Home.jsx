import React from 'react';
import Styled from 'styled-components';
import axios from 'axios';

export default function () {
  const [isDbConn, setIsDbConn] = React.useState(false);
  const [ip, setIp] = React.useState('0.0.0.0');
  const [infoList, setInfoList] = React.useState([
    { id: 'nowWeather', name: '실시간 날씨', value: '-' },
    { id: 'shortWeather', name: '단기 날씨 예보', value: '-' },
    { id: 'longWeather1', name: '중기 날씨(기온) 예보', value: '-' },
    { id: 'longWeather2', name: '중기 날씨(하늘,강수량) 예보', value: '-' },
    { id: 'nowDust', name: '실시간 미세먼지', value: '-' },
    { id: 'shortDust', name: '단기 미세먼지/초미세먼지 예보', value: '-' },
    { id: 'longDetailDust', name: '주간 초미세먼지 예보', value: '-' },
    { id: 'weatherText', name: '동네예보 통보문', value: '-' }
  ]);

  const GET = () => {
    axios.get('http://smartpole.enwiser.com/api/isConnect').then(({ data }) => {
      setIsDbConn(data?.result);
      setIp(data?.ip);
      
      let list = [...infoList];
      data.infoList.forEach(item => {
        let findIdx = list.findIndex(x => x.id === item.name);
        list[findIdx].value = item.value;
      });
      setInfoList(list);
    })
  }

  React.useEffect(() => {
    GET();
    setInterval(() => GET(), 300000);
  }, []);

  return (
    <Container>
      <title>스마트 가로등</title>
      <AccessIP>Access IP: {ip}</AccessIP>

      <Article>
        <Title>Connect State</Title>
        <ConnList>
          <ConnListTitle>Server</ConnListTitle>
          <Dot bool={true} />
        </ConnList>
        <ConnList>
          <ConnListTitle>Database</ConnListTitle>
          <Dot bool={isDbConn} />
        </ConnList>
      </Article>

      <Article>
        <Title>Last API Request</Title>
        {
          infoList.map(item => (
            <ApiList key={item.id}>
              <ApiListTitle>{item.name}</ApiListTitle>
              <ApiListValue>
                {item.value.split(' | ')[0]}<br />
                {item.value.split(' | ')[1]}
              </ApiListValue>
            </ApiList>
          ))
        }
      </Article>
    </Container>
  )
}

const Container = Styled.section`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding-top: 40px;
  padding-bottom: 40px;
`;
const AccessIP = Styled.p`
  position: fixed;
  bottom: 5px;
  left: 5px;
  color: #888;
`;
const Article = Styled.article`
  margin-bottom: 40px;
  &:last-of-type {
    margin-bottom: 0;
  }
`;
const Title = Styled.h2`
  font-size: 26px;
  margin-bottom: 16px;
  text-align: center;
  letter-spacing: 1px;
`;
const ConnList = Styled.div`
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 36px;
  margin-bottom: 6px;
`;
const ConnListTitle = Styled.h3`
  margin-right: 10px;
`;
const Dot = Styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${({bool}) => bool ? '#33db33' : '#ff4b4b'};
`;
const ApiList = Styled.div`
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  margin-bottom: 20px;
`;
const ApiListTitle = Styled.h3`
  margin-bottom: 10px;
  font-size: 16px;
`;
const ApiListValue = Styled.span`
  text-align: center;
`;