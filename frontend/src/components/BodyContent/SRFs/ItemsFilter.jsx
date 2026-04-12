import React, { useContext, useEffect, useState } from "react";
import { Card, Col, Input, Row, Spin, message } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.js";
import FilteredItems from "./FilteredItems";
import { childSrfItemsActions } from "../../../store/childSrfItems";
import { notificationActions } from "../../../store/nofitication";
import { fetchSRFItems } from "./Helper";
import "./ItemsFilter.css";

const { Search } = Input;

const ItemsFilter = () => {
  const dispatch = useDispatch();
  const auth = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [filteredItems, setFilteredItems] = useState([]);

  useEffect(() => { }, []);

  const handleError = () => {
    setLoading(false);
    message.error("Something went wrong!");
    const errNotification = {
      title: "Something went wrong",
      description: "",
      icon: "error",
      state: true,
      timeout: 1500,
    };
    dispatch(notificationActions.changenotification(errNotification));
  };

  const fetchSearchResults = async (url, key, value) => {
    try {
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({ labId: auth.labId, [key]: value }),
      };

      const response = await fetch(config.Calibmaster.URL + url, requestOptions);
      const { items } = await response.json();

      const numberedList = items.map((item, i) => ({ ...item, slNo: i + 1 }));

      dispatch(childSrfItemsActions.changesrfitems([]));
      dispatch(childSrfItemsActions.changesrfitems(numberedList));
      setFilteredItems(numberedList);
      setLoading(false);
    } catch (error) {
      console.error(error);
      handleError();
    }
  };

  const searchHandler = async (type, value) => {
    if (value === "") {
      const getSRFList = await fetchSRFItems(auth);
      dispatch(childSrfItemsActions.changesrfitems(getSRFList));
      return;
    }

    setLoading(true);

    switch (type) {
      // case "serial_no":
      //   await fetchSearchResults("/api/srf-search/serial-number", "serial_no", value);
      //   break;
      case "instrument_name":
        await fetchSearchResults("/api/srf-search/instrument-name", "instrument_name", value.trim());
        break;
      case "dispatch_number":
        await fetchSearchResults("/api/srf-search/dispatch-number", "dispatch_number", value.trim());
        break;
      case "identification_details":
        await fetchSearchResults("/api/srf-search/identification-details", "identification_details", value.trim());
        break;
      case "inward_no":
        await fetchSearchResults("/api/srf-search/inward-number", "inward_no", value.trim());
        break;
      default:
        setLoading(false);
        break;
    }
  };

  return (
    <>
      <div>
        <Card
          variant="borderless"
        >

          <div>
            <h3  className="text-lg font-bold my-5 text-center">SRF Items Filter</h3>
          </div>


          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={12} lg={6} xl={6}>
              {/* <Search
                placeholder="Search by Serial No."
                allowClear
                enterButton={<SearchOutlined />}
                onSearch={(val) => searchHandler("serial_no", val)}
                size="large"
              /> */}

              <Search
                placeholder="Search Instrument Name"
                allowClear
                enterButton={<SearchOutlined />}
                onSearch={(val) => searchHandler("instrument_name", val)}
                size="large"
              />

            </Col>

            <Col xs={24} sm={12} md={12} lg={6} xl={6}>
              <Search
                placeholder="Search by Dispatch DC"
                allowClear
                enterButton={<SearchOutlined />}
                onSearch={(val) => searchHandler("dispatch_number", val)}
                size="large"
              />
            </Col>

            <Col xs={24} sm={12} md={12} lg={6} xl={6}>
              <Search
                placeholder="Search by ID No."
                allowClear
                enterButton={<SearchOutlined />}
                onSearch={(val) => searchHandler("identification_details", val)}
                size="large"
              />
            </Col>

            <Col xs={24} sm={12} md={12} lg={6} xl={6}>
              <Search
                placeholder="Search by Inward No."
                allowClear
                enterButton={<SearchOutlined />}
                onSearch={(val) => searchHandler("inward_no", val)}
                size="large"
              />
            </Col>
          </Row>

          {loading && (
            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <Spin size="large" />
            </div>
          )}
        </Card>
      </div>

      <FilteredItems items={filteredItems} />
    </>
  );
};

export default ItemsFilter;
