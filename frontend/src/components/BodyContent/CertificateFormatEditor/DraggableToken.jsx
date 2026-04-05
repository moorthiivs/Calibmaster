// DraggableToken.js
import React from 'react';
import { useDrag } from 'react-dnd';
import './styles/DraggableToken.css';

const DraggableToken = ({ token, disabled }) => {
    const [{ isDragging }, drag] = useDrag(
        () => ({
            type: "TOKEN",
            item: { token },
            canDrag: !disabled,
            collect: (monitor) => ({ isDragging: monitor.isDragging() }),
        }),
        [disabled]
    );

    return (
        <div
            ref={drag}
            className={`token-drag ${disabled ? 'token-drag-disabled' : 'token-drag-default'} ${isDragging ? 'dragging' : ''}`}
        >
            <span className="token-text">{`{{${token}}}`}</span>
        </div>
    );
};

export default DraggableToken;
