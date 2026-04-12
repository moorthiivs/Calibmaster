// import { Card } from "react-rainbow-components";
// import "./UnavailablePage.css";
// import serviceunavailable from "../images/service-unavailable.jpg";

// const UnavailablePage = () => {
//   return (
//     <div className="service__unavailable">
//       <Card className="service__unavailable__card">
//         <img
//           className="service__unavailable__img"
//           src={serviceunavailable}
//           alt="Service Unavailable"
//         />
//       </Card>
//     </div>
//   );
// };

// export default UnavailablePage;



import React from 'react';
import { Button, Result } from 'antd';

const UnavailablePage = () => (
  <Result
    status="500"
    title="500"
    subTitle="Sorry, something went wrong."
    //extra={<Button type="primary">Back Home</Button>}
  />
);

export default UnavailablePage;
