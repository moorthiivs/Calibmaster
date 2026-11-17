import React, { useRef, useEffect, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Segmented } from 'antd';
import { QrcodeOutlined, BarcodeOutlined } from '@ant-design/icons';
import "./QRReader.css";

const QRScanner = ({ ScanData }) => {
  const scannerRef = useRef(null);
  const [scanMode, setScanMode] = useState('all'); // 'all' | 'qr' | 'barcode'

  function onScanSuccess(decodedText, decodedResult) {
    if (ScanData(decodedResult.decodedText)) {
      scannerRef.current.clear();
    }
  }

  function onScanError(errorMessage) {
    // Suppress noisy "No QR/barcode found" errors
    if (typeof errorMessage === 'string' && errorMessage.includes('No MultiFormat Readers')) return;
    if (typeof errorMessage === 'string' && errorMessage.includes('NotFoundException')) return;
  }

  const getFormats = (mode) => {
    const qrFormats = [
      Html5QrcodeSupportedFormats.QR_CODE,
      Html5QrcodeSupportedFormats.DATA_MATRIX,
    ];
    const barcodeFormats = [
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.CODE_93,
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
      Html5QrcodeSupportedFormats.ITF,
      Html5QrcodeSupportedFormats.CODABAR,
    ];
    if (mode === 'qr') return qrFormats;
    if (mode === 'barcode') return barcodeFormats;
    return [...qrFormats, ...barcodeFormats]; // 'all'
  };

  const initScanner = (mode) => {
    // Clean up existing scanner
    if (scannerRef.current) {
      try { scannerRef.current.clear(); } catch (e) { /* ignore */ }
    }

    const qrboxSize = window.innerWidth < 600 ? Math.min(250, window.innerWidth - 60) : 300;

    const config = {
      fps: 10,
      qrbox: mode === 'barcode'
        ? { width: qrboxSize, height: Math.round(qrboxSize * 0.4) }
        : qrboxSize,
      aspectRatio: 1.0,
      formatsToSupport: getFormats(mode),
    };

    scannerRef.current = new Html5QrcodeScanner("reader", config);
    scannerRef.current.render(onScanSuccess, onScanError);
  };

  useEffect(() => {
    initScanner(scanMode);

    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.clear(); } catch (e) { /* ignore */ }
      }
    };
  }, [scanMode]);

  const modeLabel = {
    all: 'QR Code or Barcode',
    qr: 'QR Code',
    barcode: 'Barcode',
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center">
        <h3 className="text-xl font-bold text-slate-800 mb-2">Scan Code</h3>
        <p className="text-sm text-slate-500 mb-4 text-center">
          Place the {modeLabel[scanMode]} inside the frame to scan
        </p>

        {/* Mode Selector */}
        <div className="mb-4">
          <Segmented
            value={scanMode}
            onChange={setScanMode}
            options={[
              { label: <span><QrcodeOutlined /> <BarcodeOutlined /> All</span>, value: 'all' },
              { label: <span><QrcodeOutlined /> QR Code</span>, value: 'qr' },
              { label: <span><BarcodeOutlined /> Barcode</span>, value: 'barcode' },
            ]}
          />
        </div>
        
        <div 
          id="reader" 
          className="w-full max-w-full rounded-xl overflow-hidden [&_video]:w-full [&_video]:object-cover"
        ></div>
      </div>
    </div>
  );
};

export default QRScanner;
