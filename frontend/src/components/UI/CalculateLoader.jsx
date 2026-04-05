import { Spinner } from 'react-rainbow-components';
import styled from 'styled-components';

const Calculating = styled.h4`
    color: rgb(1,182,245);
    font-weight: normal;
    font-size: 1rem;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 5000;
    text-align: center;
    padding: 20px 0 0 0;
`;

const CalculateLoader = () => {
  return (
    <div
      className="rainbow-align-content_center rainbow-position_relative rainbow-p-vertical_xx-large"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5000,
        pointerEvents: 'none',
      }}
    >
      <Spinner variant="brand" size="medium" />
      <Calculating>Calculating...</Calculating>
    </div>
  );
};

export default CalculateLoader;
