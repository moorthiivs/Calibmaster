import React from 'react';
import { useDrop } from 'react-dnd';
import './styles/DropTargetArea.css';

const DropTargetArea = ({
    template,
    setTemplate,
    onTokenDrop
}) => {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: "TOKEN",
        drop: async (item) => {
            const placeholder = `{{${item.token}}}`;
            const normalized = template.replace(/\s+/g, "");
            const regex = new RegExp(`{{${item.token}}}`, "g");
            const exists = regex.test(normalized);

            if (exists) {
                alert(`Token '${placeholder}' already exists in the template.`);
                return;
            }

            const value = await onTokenDrop(item.token);
            if (value === null) return;
            setTemplate((prev) => prev + placeholder);
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    }));

    const onChangeToken = (value) => {
        setTemplate(value);
    };

    return (
        <div
            ref={drop}
            className={`drop-zone ${isOver ? "drop-zone-active" : "drop-zone-inactive"}`}
        >
            <textarea
                value={template}
                onChange={(e) => onChangeToken(e.target.value)}
                rows={4}
                placeholder="Drop tokens here or type manually... Use {{tokenName}} format"
                className={`drop-textarea ${isOver ? "drop-textarea-over" : ""}`}
            />
            {isOver && (
                <div className="drop-overlay">
                    <span className="drop-overlay-text">Drop token here</span>
                </div>
            )}
        </div>
    );
};

export default DropTargetArea;
