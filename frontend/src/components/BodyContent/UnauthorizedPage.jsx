import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const UnauthorizedPage = () => {
    const navigate = useNavigate();

    return (
        <div style={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: '#fff',
            borderRadius: '8px',
            margin: '20px'
        }}>
            <Result
                status="403"
                title="403"
                subTitle="Sorry, you are not authorized to access this page."
                extra={
                    <Button type="primary" onClick={() => navigate('/dashboard')}>
                        Back to Dashboard
                    </Button>
                }
            />
        </div>
    );
};

export default UnauthorizedPage;
