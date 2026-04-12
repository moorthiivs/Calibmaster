import { Popover, Button, Tooltip } from "antd";
import { useState } from "react";

export default function ActionMenu({
    placement = "bottomRight",
    actions = [],
    triggerLabel,
    icon,
    toolTipTitle
}) {
    const [open, setOpen] = useState(false);

    const content = (
        <div className="grid grid-cols-3 gap-auto min-w-[50px] p-2">
            {actions.map((action, index) => {
                return (
                    <button
                        key={index}
                        onClick={() => {
                            action.onClick?.();
                            setOpen(false);
                        }}
                        className={`
              w-full flex items-center gap-0
              px-4 py-2.5
              text-sm text-gray-700
              transition-all duration-150
              rounded-md
              ${action.isActive === "primary" ? "bg-blue-500 text-white" : "hover:bg-gray-100"}
            `}
                    >
                        {action.icon && (
                            <span className="text-gray-500 ms-auto me-auto" style={{ color: action.isActive === "primary" ? "white" : "" }} >
                                {action.icon}
                            </span>
                        )}

                        <span className="flex-1 text-left" style={{ color: action.isActive === "primary" ? "white" : "" }}>
                            {action.label}
                        </span>

                        {action.shortcut && (
                            <span className="text-xs text-gray-400">
                                {action.shortcut}
                            </span>
                        )}
                    </button>


                );
            })}
        </div>
    );

    return (
        <Popover
            placement={placement}
            content={content}
            trigger={["click"]}
            open={open}
            onOpenChange={setOpen}
            mouseEnterDelay={0.2}
            mouseLeaveDelay={0.15}
            title={null}
        >
            <Tooltip title={toolTipTitle} placement="bottom">
                <Button
                    type="default"
                    icon={icon}
                    className="flex items-center"
                    size="large" style={{ fontSize: 16 }}
                >
                    {triggerLabel}
                </Button>
            </Tooltip>
        </Popover>
    );
}
