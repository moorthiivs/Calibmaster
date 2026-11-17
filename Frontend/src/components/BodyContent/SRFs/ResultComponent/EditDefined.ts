import { Button } from 'react-rainbow-components';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const BottomWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0px 20px 0px;
`;

export const ButtonStyled = styled(Button)`
  background-color: ${props => (props.isSet ? "#1AD1A3" : "#00A3DC")};
  color: ${props => (props.isSet ? "white" : "white")};
  border: ${props => (props.isSet ? "none" : "initial")};
  transition: background-color 0.3s ease, color 0.3s ease;

  &:hover {
    background-color: ${props => (props.isSet ? "gray" : "#1AD1A3")};
    color: ${props => (props.isSet ? "white" : "white")};
    transform: scale(1.05);
  }
`;

export const DataAddedNotification = styled.div`
  margin-top: 10px;
  padding: 10px 20px;
  background-color: #e9ffe9;
  color: #28a745;
  border: 1px solid #28a745;
  border-radius: 5px;
  display: flex;
  align-items: center;
  animation: ${fadeIn} 0.5s ease-in-out;
`;

export const NotificationText = styled.p`
  margin: 0;
  font-size: 16px;
  font-weight: bold;
`;

