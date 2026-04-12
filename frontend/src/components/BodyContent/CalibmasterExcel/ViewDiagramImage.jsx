import React, { useState } from "react";
import {
  Card,
  Upload,
  Button,
  Row,
  Col,
  Image,
  Popconfirm,
  message,
  Space,
  InputNumber,
} from "antd";
import {
  DeleteOutlined,
  InboxOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import config from "../../../utils/config.js";

const { Dragger } = Upload;

const ViewDiagramImage = ({
  viewDiagramImageData,
  onUpdateImages,
  auth,
}) => {
  const BASE_URL = `${config.Calibmaster.URL}/procedure_images/`;

  // ✅ Ensure proper object structure
  // const [images, setImages] = useState(
  //   Array.isArray(viewDiagramImageData?.diagram_image)
  //     ? viewDiagramImageData.diagram_image
  //     : []
  // );

  const [images, setImages] = useState(() => {
    if (!Array.isArray(viewDiagramImageData?.diagram_image)) return [];

    return viewDiagramImageData.diagram_image.map((img) => {
      // If already object → keep
      if (typeof img === "object" && img !== null) return img;

      // If old string format → convert
      return {
        name: img,
        width: null,
        height: null,
      };
    });
  });

  const [isSaving, setIsSaving] = useState(false);

  // ✅ Delete Image
  const handleDelete = async (index) => {
    const img = images[index];

    try {
      if (!img.name.startsWith("data:")) {
        const response = await fetch(
          `${config.Calibmaster.URL}/api/calibmasterexcel/delete-Procedure-Image?imageId=${img.name}&procedureId=${viewDiagramImageData?.cmeid}`,
          {
            method: "DELETE",
            headers: {
              Authorization: "Bearer " + auth.token,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to delete image");
        await response.json();
      }

      const updated = [...images];
      updated.splice(index, 1);
      setImages(updated);

      if (onUpdateImages) onUpdateImages(updated);

      message.success("Image deleted successfully");
    } catch (error) {
      message.error("Failed to delete image");
      console.error(error);
    }
  };

  // ✅ Upload or Replace Image
  const handleUpload = (files, replaceIndex = null) => {
    const updated = [...images];

    Array.from(files).forEach((file) => {
      const reader = new FileReader();

      reader.onload = () => {
        const newImageObj = {
          name: reader.result, // base64
          width: null,
          height: null,
        };

        if (replaceIndex !== null && replaceIndex < updated.length) {
          updated[replaceIndex] = newImageObj;
        } else {
          updated.push(newImageObj);
        }

        setImages([...updated]);
        if (onUpdateImages) onUpdateImages([...updated]);

        message.success("Image uploaded successfully");
      };

      reader.readAsDataURL(file);
    });

    return false; // prevent auto upload
  };

  // ✅ Update Width / Height
  const handleSizeChange = (index, field, value) => {
    const updated = [...images];
    updated[index][field] = value;
    setImages(updated);
  };

  // ✅ Save Images
  const handleSave = async () => {
    if (images.length === 0) {
      message.warning("No images to save");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        `${config.Calibmaster.URL}/api/calibmasterexcel/update-Procedure-Image`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth.token,
          },
          body: JSON.stringify({
            images,
            procedureId: viewDiagramImageData?.cmeid,
            userId: auth.userId,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to save images");
      }

      await response.json();
      message.success("Images saved successfully");
    } catch (error) {
      message.error("Failed to save images: " + error.message);
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      {images.length === 0 && (
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <p>No Diagrams Available</p>
        </div>
      )}

      <Row gutter={[24, 24]} justify="center">
        {images.map((img, index) => (
          <Col key={index} xs={24} sm={12} md={12} lg={12}>
            <Card
              variant="outlined"
              cover={
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 200,
                    background: "#fafafa",
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  <Image
                    src={
                      img.name.startsWith("data:")
                        ? img.name
                        : `${BASE_URL}${img.name}`
                    }
                    alt={`Diagram ${index + 1}`}
                    style={{
                      maxHeight: "100%",
                      maxWidth: "100%",
                      objectFit: "contain",
                    }}
                  />
                </div>
              }
            >
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                {/* ✅ Width & Height Inputs */}
                <Row gutter={10}>
                  <Col span={12}>
                    <InputNumber
                      placeholder="Width"
                      min={1}
                      style={{ width: "100%" }}
                      value={img.width}
                      onChange={(value) =>
                        handleSizeChange(index, "width", value)
                      }
                    />
                  </Col>

                  <Col span={12}>
                    <InputNumber
                      placeholder="Height"
                      min={1}
                      style={{ width: "100%" }}
                      value={img.height}
                      onChange={(value) =>
                        handleSizeChange(index, "height", value)
                      }
                    />
                  </Col>
                </Row>

                {/* ✅ Replace */}
                <Dragger
                  showUploadList={false}
                  multiple={false}
                  beforeUpload={(file) => handleUpload([file], index)}
                  style={{
                    padding: "10px",
                    background: "#fafafa",
                    border: "1px dashed #1890ff",
                    borderRadius: 6,
                  }}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined style={{ color: "#1890ff" }} />
                  </p>
                  <p className="ant-upload-text" style={{ marginBottom: 0 }}>
                    Drag or click to replace this image
                  </p>
                </Dragger>

                {/* ✅ Delete */}
                <Popconfirm
                  title="Are you sure you want to delete this image?"
                  onConfirm={() => handleDelete(index)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    style={{ width: "100%" }}
                  >
                    Delete
                  </Button>
                </Popconfirm>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ✅ Add New Image */}
      <div style={{ marginTop: 30 }}>
        <Card
          style={{
            borderRadius: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <Dragger
            showUploadList={false}
            multiple
            beforeUpload={(file) => handleUpload([file], null)}
            style={{
              padding: "20px",
              background: "#fafafa",
              border: "1px dashed #52c41a",
              borderRadius: 6,
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ color: "#52c41a" }} />
            </p>
            <p className="ant-upload-text" style={{ marginBottom: 0 }}>
              Drag or click to add new images
            </p>
          </Dragger>
        </Card>
      </div>

      {/* ✅ Save Button */}
      <div style={{ textAlign: "center", marginTop: 20 }}>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={isSaving}
          size="large"
        >
          Save
        </Button>
      </div>
    </div>
  );
};

export default ViewDiagramImage;
