import React from 'react';
import Styled from 'styled-components';
import axios from 'axios';
import Load from './Load';

export default function () {
  const [list, setList] = React.useState([]);
  const [isLoad, setIsLoad] = React.useState(true);
  const [isEdit, setIsEdit] = React.useState(null);

  const [nameValue, setNameValue] = React.useState('');
  const [locationValue, setLocationValue] = React.useState('');
  const [stationValue, setStationValue] = React.useState('');
  const [areaValue, setAreaValue] = React.useState('');
  const [agentValue, setAgentValue] = React.useState('');
  const [memoValue, setMemoValue] = React.useState('');

  const valueReset = () => {
    setNameValue('');
    setLocationValue('');
    setStationValue('');
    setAreaValue('');
    setAgentValue('');
    setMemoValue('');
  }

  const getList = () => {
    axios.get('/api/getDevice').then(({ data }) => {
      setList(data);
      setIsLoad(false);
    })
  }

  const save = () => {
    let id = isEdit;
    if (!nameValue) return alert('장비명을 적어주세요.');
    if (!locationValue) return alert('위치 ID를 적어주세요.');
    if (String(locationValue).search(/[a-z]/gi) > -1) return alert('위치 ID를 숫자로 적어주세요.');
    if (String(locationValue).search(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/) > -1) return alert('위치 ID를 숫자로 적어주세요.');
    if (!stationValue) return alert('측정소 ID를 적어주세요.');
    if (String(stationValue).search(/[a-z]/gi) > -1) return alert('측정소 ID를 숫자로 적어주세요.');
    if (String(stationValue).search(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/) > -1) return alert('측정소 ID를 숫자로 적어주세요.');
    if (!areaValue) return alert('지역코드를 적어주세요.');
    if (!agentValue) return alert('담당센터 또는 담당자의 이름을 적어주세요.');
    let query = (`${!id ? '/api/addDevice?' : '/api/modifyDevice/' + id + '?'}nameValue=${nameValue}&locationValue=${locationValue}&stationValue=${stationValue}&areaValue=${areaValue}&agentValue=${agentValue}&memoValue=${memoValue}`);
    axios[!id ? 'post' : 'put'](query).then(({ data }) => {
      if (!data) return alert('장비 ' + (isEdit === 0 ? '등록' : '수정') + ' 에 실패하였습니다.\n관리자에게 문의해주세요.');
      valueReset();
      setIsEdit(null);
      getList();
    });
  }

  const add = () => setIsEdit(0);
  const modify = e => setIsEdit(Number(e.target.getAttribute('data-id')));
  const remove = e => {
    let id = Number(e.target.getAttribute('data-id'));
    let ask = confirm('해당 장비를 삭제하시겠습니까?');
    if (!ask) return;
    
    axios.delete('/api/delDevice/' + id).then(({ data }) => {
      if (!data) return alert('삭제에 실패하였습니다.');
      getList();
    }); 
  }

  React.useEffect(() => {
    valueReset();
    if (isEdit) {
      let find = list.find(x => x.ID === isEdit);
      setNameValue(find.NAME);
      setLocationValue(find.LOCATION_ID);
      setStationValue(find.STATION_ID);
      setAreaValue(find.AREA_CODE_ID);
      setAgentValue(find.AGENT);
      setMemoValue(find.DESCRIPTION);
    }
  }, [isEdit]);

  React.useEffect(() => {
    getList();
  }, []);

  return (
    <>
      <title>스마트 가로등 :: 장비관리</title>
      <OptionBar>
        { isEdit === null && <h2>장비 목록 (목록 수: {list.length}개)</h2> }
        { isEdit !== null && isEdit === 0 && <h2>장비 등록</h2> }
        { isEdit !== null && isEdit > 0 && <h2>장비 수정</h2> }
        <span>
          { isEdit === null && <button onClick={add}>장비등록</button> }
          { isEdit !== null && isEdit === 0 && <button onClick={save}>등록</button>}
          { isEdit !== null && isEdit > 0 && <button onClick={save}>수정</button>}
          { isEdit !== null && <button onClick={() => setIsEdit(null)}>취소</button> }
        </span>
      </OptionBar>
      {isEdit === null && (
        <Device>
          {list.map(item => (
            <List key={item.ID}>
              <p>장비명: {item.NAME}</p>
              <p>위치: {item.PATH1} {item.PATH2} {item.PATH3}</p>
              <p>측정소: {item.STATION_NAME}</p>
              <p>지역: {item.AREA} / {item.CITY}</p>
              <p>담당: {item.AGENT}</p>
              <p>메모: {item.DESCRIPTION}</p>
              <p>등록일: {item.CREATE_DATE}</p>
              <ButtonContainer>
                <button data-id={item.ID} onClick={modify}>수정</button>
                <button data-id={item.ID} onClick={remove}>삭제</button>
              </ButtonContainer>
            </List>
          ))}
        </Device>
      )}
      {isEdit !== null && (
        <EditDevice>
          <p>장비명: <input value={nameValue} onChange={e => setNameValue(e.target.value.trim())} placeholder='장비명을 적어주세요.' /></p>
          <p>위치: <input value={locationValue} onChange={e => setLocationValue(e.target.value.trim())} placeholder='위치 ID를 적어주세요.' /></p>
          <p>측정소: <input value={stationValue} onChange={e => setStationValue(e.target.value.trim())} placeholder='측정소 ID를 적어주세요.' /></p>
          <p>지역: <input value={areaValue} onChange={e => setAreaValue(e.target.value.trim())} placeholder='지역코드를 적어주세요.' /></p>
          <p>담당: <input value={agentValue} onChange={e => setAgentValue(e.target.value.trim())} placeholder='담당센터 또는 담당자의 이름을 적어주세요.'/></p>
          <p>메모: <input value={memoValue} onChange={e => setMemoValue(e.target.value.trim())} placeholder='메모를 적어주세요. (선택)'/></p>
        </EditDevice>
      )}
      { isLoad && <Load /> }
    </>
  )
}

const OptionBar = Styled.div`
  display: flex;
  align-items: center;
  padding-bottom: 10px;
  justify-content: space-between;
  h2 {
    font-size: 16px;
    letter-spacing: 1px;
  }
  button {
    padding: 8px 14px;
    border: none;
    border-radius: 3px;
    margin-left: 10px;
    background-color: #666;
    &:hover {
      background-color: #514f4f;
    }
    &:active {
      background-color: #454242;
    }
  }
`;
const Device = Styled.ul``;
const List = Styled.li`
  padding: 10px;
  border-radius: 6px;
  background-color: #777;
  border: 1px solid #555;
  margin-bottom: 10px;
  position: relative;

  &:hover {
    background-color: #555;
    & > div {
      display: block;
    }
  }
`;
const ButtonContainer = Styled.div`
  position: absolute;
  display: none;
  top: 10px;
  right: 10px;

  & > button {
    padding: 4px 10px;
    background-color: transparent;
    border: 0;
    border-radius: 3px;

    &:hover {
      background-color: #666;
    }
  }
`;

const EditDevice = Styled.div`
  p {
    padding: 10px 0;
    font-size: 16px;
    display: flex;
    align-items: center;
  }
  input {
    width: 300px;
    height: 30px;
    padding: 0 5px;
    margin-left: 6px;
    color: #333;
  }
`;