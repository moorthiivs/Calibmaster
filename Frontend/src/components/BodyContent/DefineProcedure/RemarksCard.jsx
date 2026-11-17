import React from "react";
import { Card, Input, Button, Space } from "antd";

const RemarksCard = ({ remarks, addRemarksHandler, remarkChangeHandler, deleteRemarkHandler }) => {
    return (
        <Card title="Add Remarks" style={{ marginTop: "10px" }}>
            <Button
                type="primary"
                style={{ marginBottom: "16px" }}
                onClick={addRemarksHandler}
            >
                Add Remarks
            </Button>

            <section className="remarks_section">
                <Space direction="vertical" style={{ width: "100%" }}>
                    {remarks.map((data, i) => (
                        <div
                            key={i}
                            style={{
                                display: "flex",
                                flexWrap: "wrap", // allow wrapping on small screens
                                gap: "10px",
                                marginBottom: "10px",
                            }}
                        >
                            <Input
                                placeholder="Enter Remarks"
                                value={data}
                                onChange={(e) => remarkChangeHandler(e, i)}
                                style={{
                                    flex: "1 1 250px", // input grows but min width 250px
                                    minWidth: "150px", // ensures it doesn’t shrink too small
                                }}
                                size="large"
                            />
                            <Button
                                danger
                                style={{ flex: "0 0 auto" }} // button keeps its width
                                onClick={() => deleteRemarkHandler(i)}
                                size="large"
                            >
                                Delete
                            </Button>
                        </div>
                    ))}
                </Space>
            </section>
        </Card>
    );
};

export default RemarksCard;
