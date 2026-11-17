import React, { useContext, useEffect, useState } from "react";
import { Card, Col, Input, Row, Spin } from "antd";
import GlobalNotification from "../../../utils/GlobalNotification";
import { SearchOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.json";
import FilteredItems from "./FilteredItems";
import { childSrfItemsActions } from "../../../store/childSrfItems";
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
    GlobalNotification.error({
      title: "Error",
      description: "Something went wrong!"
    });
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
      const res = await fetchSRFItems(auth);
      dispatch(childSrfItemsActions.changesrfitems(res.items || []));
      setFilteredItems(res.items || []);
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
        <div className="w-full bg-white dark:bg-transparent rounded-xl">

          <div>
            <h3  className="text-lg font-bold my-5 text-center">SRF Items Filter</h3>
          </div>


          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-start gap-4 p-2 w-full">
            <div className="w-full sm:w-auto flex-1 min-w-[200px]">
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
            </div>

            <div className="w-full sm:w-auto flex-1 min-w-[200px]">
              <Search
                placeholder="Search by Dispatch DC"
                allowClear
                enterButton={<SearchOutlined />}
                onSearch={(val) => searchHandler("dispatch_number", val)}
                size="large"
              />
            </div>

            <div className="w-full sm:w-auto flex-1 min-w-[200px]">
              <Search
                placeholder="Search by ID No."
                allowClear
                enterButton={<SearchOutlined />}
                onSearch={(val) => searchHandler("identification_details", val)}
                size="large"
              />
            </div>

            <div className="w-full sm:w-auto flex-1 min-w-[200px]">
              <Search
                placeholder="Search by Inward No."
                allowClear
                enterButton={<SearchOutlined />}
                onSearch={(val) => searchHandler("inward_no", val)}
                size="large"
              />
            </div>
          </div>

          {loading && (
            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <Spin size="large" />
            </div>
          )}
        </div>
      </div>

      <FilteredItems items={filteredItems} />
    </>
  );
};

export default ItemsFilter;
