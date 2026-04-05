import styled from "styled-components"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

export const SyncPageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-left: 4rem;
  background-color: #f5f5f5;
  min-height: 80vh;
`

export const Header = styled.h1`
  font-size: 2.5em;
  text-align: center;
  background: black;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent; /* Makes gradient text */
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3); /* Adds shadow for depth */
  margin-bottom: 20px;

  /* Add a subtle animation on hover */
  transition: transform 0.3s ease-in-out;
  &:hover {
    transform: scale(1.1);
  }
`

export const CardContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.5rem;
`

export const Card = styled.div`
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  text-align: center;
  width: 100%;
  max-width: 300px; /* Adjust this value as needed */
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }

  @media (min-width: 768px) {
    width: 45%; /* Adjust this value as needed */
  }

  @media (min-width: 1024px) {
    width: 30%; /* Adjust this value as needed */
  }
`

export const CardTitle = styled.h2`
  font-size: 1.2rem;
  color: #333;
  font-weight: 500;
  margin-bottom: 1rem;
`

export const SyncButton = styled.button`
  background-color: #01b9f6;
  color: white;
  border: none;
  padding: 15px 30px;
  font-size: 16px;
  cursor: pointer;
  border-radius: 5px;
  margin-top: 1rem;
  transition: background-color 0.3s ease, transform 0.3s ease;

  &:hover {
    background-color: #0056b3;
    transform: translateY(-3px);
  }

  &:active {
    transform: translateY(1px);
  }
`

export const SyncIcon = styled(FontAwesomeIcon)`
  margin-right: 10px;
  transition: transform 1s cubic-bezier(0.25, 0.1, 0.25, 1);

  ${SyncButton}:hover & {
    transform: rotate(360deg);
  }
`
