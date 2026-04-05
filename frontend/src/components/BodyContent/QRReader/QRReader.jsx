import React, { useRef } from 'react';
import { useEffect } from "react";
import { Html5QrcodeScanner } from 'html5-qrcode';
import "./QRReader.css"
import { Card } from 'react-rainbow-components';


const QRScanner = ({ ScanData }) => {
  const scannerRef = useRef(null);

  function onScanSuccess(decodedText, decodedResult) {
    if (ScanData(decodedResult.decodedText)) {
      scannerRef.current.clear();
    }
  }

  function onScanError(errorMessage) {
    console.error(errorMessage)
  }

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner("reader", { fps: 10, qrbox: window.innerWidth / 3 });
    scannerRef.current.render(onScanSuccess, onScanError);

    return () => {
      scannerRef.current?.clear();
    };
  }, []);

  return <Card style={{ width: '100%', display: "flex", flexDirection: "column", padding: "1rem", alignItems: "center" }}>
    <div id="reader" style={{ width: '100%', height: '100%', alignItems: 'center' }} sx={{ width: '100%', height: 400, border: '2px solid #ccc', mb: 2 }} ></div>
  </Card>;
};

export default QRScanner;


// import React, { useRef, useEffect, useState } from "react";
// import QrScanner from "qr-scanner";
// import { Card, Typography, Button } from "antd";
// import { ReloadOutlined } from "@ant-design/icons";
// import "./QRReader.css";

// const { Title } = Typography;

// const QRScanner = ({ ScanData }) => {
//   const videoRef = useRef(null);
//   const scannerRef = useRef(null);
//   const [loading, setLoading] = useState(true);

//   const onScanSuccess = (decodedText) => {
//     if (ScanData(decodedText)) {
//       if (scannerRef.current) {
//         scannerRef.current.stop();
//       }
//     }
//   };

//   const onScanError = (err) => {
//     // Ignore "No QR code found" spam
//     if (err?.message?.includes("No QR code found")) return;
//     console.warn("QR Scan Error:", err);
//   };

//   useEffect(() => {
//     if (!videoRef.current) return;

//     const scanner = new QrScanner(
//       videoRef.current,
//       (result) => {
//         setLoading(false);
//         onScanSuccess(result.data);
//       },
//       {
//         onDecodeError: onScanError,
//         highlightScanRegion: true,
//         highlightCodeOutline: true,
//       }
//     );

//     scanner.start().catch((err) => console.error("Scanner start error:", err));
//     scannerRef.current = scanner;

//     return () => {
//       try {
//         scanner.stop();
//       } catch (err) {
//         console.error("Stop error:", err);
//       }
//       scannerRef.current = null;
//     };
//   }, []);


//   return (
//     <Card bordered style={{ width: "100%", padding: "1rem", textAlign: "center" }}>
//       <Title level={4}>Scan QR Code</Title>

//       <div
//         style={{
//           width: "100%",
//           height: 400,
//           border: "2px solid #d9d9d9",
//           borderRadius: 8,
//           display: "flex",
//           justifyContent: "center",
//           alignItems: "center",
//           overflow: "hidden",
//           position: "relative",
//         }}
//       >
//         <video
//           ref={videoRef}
//           style={{
//             width: "100%",
//             height: "100%",
//             objectFit: "cover",
//           }}
//         />
//         {loading && (
//           <div
//             style={{
//               position: "absolute",
//               color: "#999",
//               background: "rgba(255,255,255,0.8)",
//               padding: "8px 12px",
//               borderRadius: 6,
//             }}
//           >
//             Initializing scanner...
//           </div>
//         )}
//       </div>

//       <Button
//         icon={<ReloadOutlined />}
//         style={{ marginTop: 16 }}
//         onClick={() => window.location.reload()}
//       >
//         Restart Scanner
//       </Button>
//     </Card>
//   );
// };

// export default QRScanner;
