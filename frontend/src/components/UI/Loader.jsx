import { Spinner } from 'react-rainbow-components';

const Loader = () => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(5px)',
      }}
    >
      <Spinner size="large" />
    </div>
  );
}
export default Loader;