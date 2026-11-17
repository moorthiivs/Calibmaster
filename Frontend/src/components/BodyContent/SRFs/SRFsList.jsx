import "./SRFsList.css";
import { useLocation, useNavigate } from "react-router-dom";

import { useContext, useEffect, useState, useRef } from "react";
import {
  TableWithBrowserPagination,
  Column,
  Button,
  Spinner
} from "react-rainbow-components";
// import {
//   Input
// } from "react-rainbow-components";
import { useDispatch, useSelector } from "react-redux";
import { AuthContext } from "../../../context/auth-context";
import config from "../../../utils/config.json";
import GlobalNotification from "../../../utils/GlobalNotification";
import { srfsActions } from "../../../store/srfs";
import CustomSearch from "../../Inputs/CustomSearch";
import ViewSRFModal from "./ViewSRFModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { filteredsrfsActions } from "../../../store/filteredsrfs";
import { childSrfItemsActions } from "../../../store/childSrfItems";
import { convertDateFormat } from "../../../utils/filters";
import Loader from "../../UI/Loader";
import showConfirmationDialog, { showAdvancedDeleteDialog } from "../../../utils/showConfirmationToast";
import AntTableSRF from "../../Table/AntTableSRF";
import { Input, Skeleton, Card } from "antd";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(customParseFormat);
dayjs.extend(isBetween);

const SRFsList = (props) => {

  const srfs = useSelector((state) => state.srfs.list);
  const filteredSRFs = useSelector((state) => state.filteredsrfs.list);

  const dispatch = useDispatch();
  const auth = useContext(AuthContext);

  const [modifiedSRFs, setModifiedSRFs] = useState();
  const [isLoaded, setIsLoaded] = useState(true);
  const [viewSRFModal, setViewSRFModal] = useState(false);
  const [viewId, setViewId] = useState();
  const [SRFList, setSRFList] = useState([]);
  const [SRFListCopy, setSRFListCopy] = useState([]);
  const [error, setError] = useState();
  const [pageLoading, setPageLoading] = useState(true);

  // Dashboard chart click-through: read filter from URL query params
  const location = useLocation();
  const navigateSrf = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const dashboardCustomer = queryParams.get("customer") || "";
  const dashboardStatus = queryParams.get("status") || "";
  const dashboardFromDate = queryParams.get("fromDate") || "";
  const dashboardToDate = queryParams.get("toDate") || "";
  const dashboardSrfId = queryParams.get("srfId") || "";
  const dashboardSrfNumber = queryParams.get("srfNumber") || "";
  const [activeFilter, setActiveFilter] = useState({
    customer: dashboardCustomer,
    status: dashboardStatus,
    fromDate: dashboardFromDate,
    toDate: dashboardToDate,
    srfId: dashboardSrfId,
    srfNumber: dashboardSrfNumber
  });

  useEffect(() => {
    // if (srfs) {
    //   let addedzero = [];
    //   srfs.forEach((element) => {
    //     if (element.sno > 0 && element.sno < 10) {
    //       addedzero.push("0000" + element.sno);
    //     }
    //     if (element.sno > 9 && element.sno < 100) {
    //       addedzero.push("000" + element.sno);
    //     }
    //     if (element.sno > 99 && element.sno < 1000) {
    //       addedzero.push("00" + element.sno);
    //     }
    //     if (element.sno > 999 && element.sno < 10000) {
    //       addedzero.push("0" + element.sno);
    //     }
    //     if (element.sno > 9999 && element.sno < 100000) {
    //       addedzero.push("" + element.sno);
    //     }
    //   });

    //   const modifiedsrfs = srfs.map((v, i) => ({
    //     ...v,
    //     srfId:
    //       v.lab.symbol +
    //       "/" +
    //       v.year.toString().slice(2) +
    //       "/" +
    //       v.type +
    //       addedzero[i],
    //     sno: i + 1,
    //     company_name: v.Company.companyname,
    //     date: v.date.split("-").reverse().join("-"),
    //     agreed_date: v.agreed_date.split("-").reverse().join("-"),
    //     customer_dc_date: v.customer_dc_date.split("-").reverse().join("-"),
    //   }));
    //   setModifiedSRFs(modifiedsrfs);
    //   console.log(modifiedSRFs);
    // }
  }, [srfs]);

  useEffect(() => {
    // setIsLoaded(false);
    // const requestOptions = {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     Authorization: "Bearer " + auth.token,
    //   },
    //   body: JSON.stringify({ labId: auth.labId }),
    // };
    // const errornotification = {
    //   title: "Error while Getting SRFs!!",
    //   description: "Getting List of SRFs Failed!!",
    //   icon: "error",
    //   state: true,
    //   timeout: 15000,
    // };

    // fetch(config.Calibmaster.URL + "/api/srf/getall", requestOptions)
    //   .then(async (response) => {
    //     const data = await response.json();

    //     setIsLoaded(true);
    //     dispatch(srfsActions.changesrfs(data.data));

    //   })
    //   .catch((err) => {
    //     setIsLoaded(true);

    //   });
  }, []);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("srf_id");
  const [sortOrder, setSortOrder] = useState("DESC");

  const abortControllerRef = useRef(null);

  // Fetch SRF List
  async function fetchSRFList(p = page, l = limit, s = searchText, sb = sortBy, so = sortOrder) {
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setPageLoading(true);
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          labId: auth.labId,
          userId: auth.userId,
          page: p,
          limit: l,
          search: s,
          sortBy: sb,
          sortOrder: so
        }),
      };

      const response = await fetch(config.Calibmaster.URL + "/api/srf/getall", requestOptions);
      const resData = await response.json();
      const listData = resData?.data || [];
      const pagination = resData?.pagination || {};

      let counter = (p - 1) * l + 1;
      for (let i = 0; i < listData.length; i++) {
        listData[i].id = counter++;
      }

      setSRFList(listData);
      setSRFListCopy(listData);
      setTotalItems(pagination?.totalItems || listData.length);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.log(err);
      }
    } finally {
      setPageLoading(false);
    }
  }

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchSRFList(1, limit, searchText, sortBy, sortOrder);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchText]);

  const handleTableChange = (paginationObj, filtersObj, sorterObj) => {
    const newPage = paginationObj?.current || 1;
    const newLimit = paginationObj?.pageSize || 20;
    let newSortBy = sortBy;
    let newSortOrder = sortOrder;

    if (sorterObj && sorterObj.field) {
      newSortBy = sorterObj.field;
      newSortOrder = sorterObj.order === "ascend" ? "ASC" : "DESC";
    }

    setPage(newPage);
    setLimit(newLimit);
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    fetchSRFList(newPage, newLimit, searchText, newSortBy, newSortOrder);
  };

  const searchSrfNoHandler = (val) => {
    setSearchText(val);
  };

  const searchCustomerDCHandler = (val) => {
    setSearchText(val);
  };

  const searchCustomerNameHandler = (val) => {
    setSearchText(val);
  };

  // Apply dashboard chart filter to the SRF list
  const applyDashboardFilter = (customer, status) => {
    // We need to wait for state to be set, so use the callback pattern via useEffect
  };

  // Effect to auto-filter once SRFListCopy is populated (from dashboard click-through)
  const [filteredItemCount, setFilteredItemCount] = useState(0);

  // Fetch items for filtered SRFs, group by srf_id for per-SRF badge, dispatch to redux
  const fetchFilteredItems = async (srfIds, status) => {
    try {
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({ labId: auth.labId, srf_ids: srfIds, userId: auth.userId })
      };

      let response = await fetch(config.Calibmaster.URL + "/api/srf-search/srf-items", requestOptions);
      const { items } = await response.json();

      if (!items) {
        setFilteredItemCount(0);
        return;
      }

      // Filter items by status
      let matchedItems = items;
      if (status && status !== "upcoming_due") {
        matchedItems = items.filter(item => item.status === status);
      } else if (status === "upcoming_due") {
        matchedItems = items.filter(item => item.calibration_due_date);
      }

      // Total count
      setFilteredItemCount(matchedItems.length);

      // Group by srf_id for per-SRF badge counts
      const countBySrf = {};
      matchedItems.forEach(item => {
        countBySrf[item.srf_id] = (countBySrf[item.srf_id] || 0) + 1;
      });

      // Update SRFList with per-SRF item counts
      setSRFList(prev => prev.map(srf => ({
        ...srf,
        dashboardItemCount: countBySrf[srf.srf_id] || 0
      })));

      // Dispatch filtered items to redux so the Items table auto-updates
      const numberedItems = matchedItems.map((item, i) => ({ ...item, slNo: i + 1 }));
      dispatch(childSrfItemsActions.changesrfitems(numberedItems));

    } catch (error) {
      console.log(error);
      setFilteredItemCount(0);
    }
  };

  useEffect(() => {
    if (SRFListCopy.length > 0 && activeFilter.customer) {
      const filtered = SRFListCopy.filter((item) => {
        // Exact customer name match
        const customerName = (item?.customer?.customer_name || "").trim().toLowerCase();
        const filterName = activeFilter.customer.trim().toLowerCase();
        if (customerName !== filterName) return false;

        // Date range filter (if dates provided)
        if (activeFilter.fromDate && activeFilter.toDate) {
          const srfDate = dayjs(item.srf_date);
          const from = dayjs(activeFilter.fromDate, "DD-MM-YYYY");
          const to = dayjs(activeFilter.toDate, "DD-MM-YYYY");
          if (srfDate.isValid() && from.isValid() && to.isValid()) {
            if (!srfDate.isBetween(from, to, 'day', '[]')) return false;
          }
        }

        return true;
      });
      setSRFList(filtered);

      // Fetch items for filtered SRFs (for badge + items table)
      if (filtered.length > 0) {
        const ids = filtered.map(srf => srf.srf_id);
        fetchFilteredItems(ids, activeFilter.status);
      } else {
        setFilteredItemCount(0);
      }
    }
  }, [SRFListCopy, activeFilter.customer]);

  // Filter by specific SRF (from Recent SRF Activity click)
  useEffect(() => {
    if (SRFListCopy.length > 0 && activeFilter.srfId && !activeFilter.customer) {
      const filtered = SRFListCopy.filter((item) => {
        return String(item.srf_id) === String(activeFilter.srfId);
      });
      setSRFList(filtered);

      // Fetch items for this specific SRF
      if (filtered.length > 0) {
        const ids = filtered.map(srf => srf.srf_id);
        fetchFilteredItems(ids, "");
      } else {
        setFilteredItemCount(0);
      }
    }
  }, [SRFListCopy, activeFilter.srfId]);

  const clearDashboardFilter = async () => {
    setActiveFilter({ customer: "", status: "", fromDate: "", toDate: "", srfId: "", srfNumber: "" });
    setFilteredItemCount(0);
    setSRFList(SRFListCopy);
    // Remove query params from URL without a full navigation
    navigateSrf(location.pathname, { replace: true });

    // Re-fetch all items to reset the Items table below
    try {
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({ labId: auth.labId, userId: auth.userId }),
      };
      const response = await fetch(config.Calibmaster.URL + "/api/srf/getSrfItems", requestOptions);
      const { data } = await response.json();
      if (data?.items) {
        const numberedItems = data.items.map((item, i) => ({ ...item, slNo: i + 1 }));
        dispatch(childSrfItemsActions.changesrfitems(numberedItems));
      }
    } catch (error) {
      console.log("Error re-fetching all items:", error);
    }
  };

  const srfViewHandler = (v) => {
    // return console.log(v);
    setViewSRFModal(true);
    setViewId(v);
  };

  const viewmodalHandler = () => {
    const srfviewmodal = viewSRFModal;
    setViewSRFModal(!srfviewmodal);
  };

  const ViewSRF = ({ value }) => (
    <Button
      variant="neutral"
      label="View"
      onClick={() => srfViewHandler(value)}
    />
  );

  const PreviewSRF = ({ value }) => (
    <Button
      variant="brand"
      label="Preview"
      onClick={() => srfPreviewHandler(value)}
    />
  );

  const DeleteSRF = ({ value }) => (
    <Button
      variant='destructive'
      label="Delete"
      onClick={() => handleDeleteSRF(value)}
    />
  );


  const SRFType = ({ value }) => {
    const typeMap = {
      I: "NABL",
      N: "NON NABL",
      S: "SERVICES",
    };
    return <span title={typeMap[value] || "UNKNOWN"} >{typeMap[value] || "UNKNOWN"}</span>;
  };

  const handleDeleteSRF = async (srf_id) => {

    try {
      const confirmDelete = await showAdvancedDeleteDialog("Are you sure you want to delete this SRF? All associated items will also be deleted.");

      if (!confirmDelete.isConfirmed) {
        console.log("Cancel Delete!");
        return;
      }
      setIsLoaded(false);

      const requestOptions = {
        method: "Delete",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({ labId: auth.labId, srf_id: srf_id, deletedby: auth.userId, isPermanent: confirmDelete.isPermanent }),
      };

      const response = await fetch(config.Calibmaster.URL + "/api/srf/deletesrf", requestOptions);
      const { data } = await response.json();

      if (response.ok) {
        fetchSRFList();
      }

    } catch (error) {

      console.log(error);

    } finally {
      setIsLoaded(true);
    }
  }

  const handleBulkDeleteSRFs = async (srf_ids) => {
    try {
      const confirmDelete = await showAdvancedDeleteDialog(`Are you sure you want to delete these ${srf_ids.length} SRFs? All associated items will also be deleted.`);

      if (!confirmDelete.isConfirmed) {
        console.log("Cancel Delete!");
        return;
      }

      setIsLoaded(false);

      const requestOptions = {
        method: "Delete",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({
          labId: auth.labId,
          srf_ids: srf_ids,
          deletedby: auth.userId,
          isPermanent: confirmDelete.isPermanent
        }),
      };

      const response = await fetch(config.Calibmaster.URL + "/api/srf/deletebulksrf", requestOptions);

      if (response.ok) {
        fetchSRFList();
      }

    } catch (error) {
      console.log(error);
    } finally {
      setIsLoaded(true);
    }
  }

  const srfPreviewHandler = async (srf_id) => {

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth.token,
      },
      responseType: "blob",
      body: JSON.stringify({ srf_id }),
    };

    await fetch(config.Calibmaster.URL + "/api/excel/download-excel", requestOptions)
      .then(response => response.blob())
      .then(blob => {
        const blobURL = window.URL.createObjectURL(new Blob([blob]));

        const fileName = "srf-" + new Date().getTime() + ".xlsx";
        const aTag = document.createElement('a');
        aTag.href = blobURL;
        aTag.setAttribute('download', fileName);
        document.body.appendChild(aTag);
        aTag.click();
        aTag.remove();

        GlobalNotification.success({
            title: "SRF Downloaded Successfully!!",
            description: "The excel file has been saved to your downloads."
        });
      }).catch((err) => {
        console.log(err);
        GlobalNotification.error({
          title: "Error while downloading SRF!!",
        });
      })
  };

  const findCustomerName = ({ value }) => {
    return value?.customer_name;
  }

  // *** Commond Function for Search SRF Items and set in redux store ***
  async function fetchSRFItems(ids) {

    try {
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({ labId: auth.labId, srf_ids: ids, userId: auth.userId })
      };

      let response = await fetch(config.Calibmaster.URL + "/api/srf-search/srf-items", requestOptions);
      const { items } = await response.json();

      const newSRFList = async (arr) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i].slNo = i + 1;
        }
        return arr;
      }
      let getSRFList = await newSRFList(items);

      dispatch(childSrfItemsActions.changesrfitems([]));
      dispatch(childSrfItemsActions.changesrfitems(getSRFList));
    } catch (error) {
      console.log(error);
    }
  }

  //*** Fetch SRF Items ***/
  async function fetchLabSRFItems() {
    try {
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + auth.token,
        },
        body: JSON.stringify({ labId: auth.labId, userId: auth.userId }),
      };

      const response = await fetch(config.Calibmaster.URL + "/api/srf/getSrfItems", requestOptions);
      const { data } = await response.json();
      const { items } = data;

      const newSRFList = async (arr) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i].slNo = i + 1;
        }
        return arr;
      }
      let getSRFList = await newSRFList(items);
      dispatch(childSrfItemsActions.changesrfitems(getSRFList));
    } catch (error) {
      console.log(error);
    }
  }

  const handleBulkDownload = async (srf_id) => {
    try {
      setIsLoaded(false);

      const response = await fetch(
        `${config.Calibmaster.URL}/api/generate-certificate/bulkDownload_Certificate?srf_id=${srf_id}&lab_id=${auth.labId}`,
        {
          method: "GET",
          headers: {
            Authorization: "Bearer " + auth.token,
          },
        }
      );

      if (!response.ok) {
        // Try to parse JSON error message
        let errorMsg = `Failed to download certificates.`;
        try {
          const errorData = await response.json();
          if (errorData.message) errorMsg = errorData.message;
        } catch (err) {
          // Not JSON (probably ZIP) — ignore
        }
        GlobalNotification.warning({
            title: "Download Warning",
            description: errorMsg
        });
        return;
      }

      // Get the blob data
      const blob = await response.blob();

      // Create a temporary link to trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `srf_${srf_id}_certificates.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Bulk download error:", error);
      GlobalNotification.error({
        title: "Download Failed",
        description: "Something went wrong while downloading certificates."
      });
    } finally {
      setIsLoaded(true);
    }
  };

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden p-2 sm:p-4 bg-gray-50/50 dark:bg-transparent">
      <div className="w-full bg-white dark:bg-transparent rounded-xl shadow-sm overflow-hidden flex flex-col">

        {/* Dashboard filter banner */}
        {(activeFilter.customer || activeFilter.status || activeFilter.srfNumber) && (
          <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg mx-2 mt-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 flex-shrink-0"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            <span className="text-sm text-blue-800 font-medium flex-1">
              Filtered by:
              {activeFilter.srfNumber && <span className="ml-1">SRF = <strong>{activeFilter.srfNumber}</strong></span>}
              {activeFilter.srfNumber && activeFilter.customer && <span className="mx-1">•</span>}
              {activeFilter.customer && <span className="ml-1">Customer = <strong>{activeFilter.customer}</strong></span>}
              {activeFilter.customer && activeFilter.status && <span className="mx-1">•</span>}
              {activeFilter.status && <span>Status = <strong>{activeFilter.status === "upcoming_due" ? "Upcoming Due" : activeFilter.status}</strong></span>}
              {activeFilter.fromDate && activeFilter.toDate && (
                <span className="mx-1">• <strong>{activeFilter.fromDate}</strong> to <strong>{activeFilter.toDate}</strong></span>
              )}
              {filteredItemCount > 0 && (
                <span className="ml-2 inline-flex items-center bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
                  {filteredItemCount} {filteredItemCount === 1 ? "item" : "items"}
                </span>
              )}
            </span>
            <button
              onClick={clearDashboardFilter}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full p-1 transition-colors"
              title="Clear filter"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-start gap-4 px-2 py-4 w-full">
          <div className="w-full sm:w-auto flex-1 min-w-[250px]">
            <Input
              label="Search By SRF No."
              placeholder="Search By SRF No."
              onChange={(e) => searchSrfNoHandler(e.target.value)}
              allowClear
              size="large"
              prefix={<FontAwesomeIcon icon={faSearch} className=" text-muted mr-2" />}
            />
          </div>

          <div className="w-full sm:w-auto flex-1 min-w-[250px]">
            <Input
              label="Search By Customer DC"
              placeholder="Search By Customer DC"
              prefix={<FontAwesomeIcon icon={faSearch} className=" text-muted mr-2" />}
              onChange={(e) => searchCustomerDCHandler(e.target.value)}
              allowClear
              size="large"
            />
          </div>

          <div className="w-full sm:w-auto flex-1 min-w-[250px]">
            <Input
              label="Search By Customer Name"
              placeholder="Search By Customer Name"
              prefix={<FontAwesomeIcon icon={faSearch} className=" text-muted mr-2" />}
              onChange={(e) => searchCustomerNameHandler(e.target.value)}
              allowClear
              size="large"
            />
          </div>
        </div>



        {pageLoading ? (
          <Card className="mt-4 w-full overflow-hidden" variant="borderless">
            <div className="overflow-x-auto w-full">
              {/* Skeleton table header */}
              <div className="flex gap-4 mb-4 px-2 min-w-max">
                {[60, 100, 90, 140, 100, 110, 110, 90, 100, 100].map((w, i) => (
                  <Skeleton.Input key={i} active size="small" style={{ width: w }} />
                ))}
              </div>
              {/* Skeleton table rows */}
              {[...Array(5)].map((_, row) => (
                <div key={row} className="flex gap-4 mb-3 px-2 min-w-max">
                  {[60, 100, 90, 140, 100, 110, 110, 90, 100, 100].map((w, i) => (
                    <Skeleton.Input key={i} active size="small" style={{ width: w, height: 20 }} />
                  ))}
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <div className="w-full overflow-x-auto bg-white dark:bg-transparent rounded-lg shadow-sm">
            <AntTableSRF
              SRFList={SRFList}
              auth={auth}
              srfViewHandler={srfViewHandler}
              srfPreviewHandler={srfPreviewHandler}
              handleDeleteSRF={handleDeleteSRF}
              handleBulkDeleteSRFs={handleBulkDeleteSRFs}
              handleBulkDownload={handleBulkDownload}
              dashboardStatus={activeFilter.status}
              pagination={{
                current: page,
                pageSize: limit,
                total: totalItems,
                showSizeChanger: true,
                pageSizeOptions: ['5', '10', '20', '50', '100'],
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
              }}
              onChange={handleTableChange}
            />
          </div>
        )}

        {!isLoaded ? <Loader /> : null}

        {viewSRFModal ? (
          <ViewSRFModal
            isopen={viewSRFModal}
            onclose={viewmodalHandler}
            srfid={viewId}
            onUpdateSuccess={fetchSRFList}
          />
        ) : null}
      </div>
    </div>
  );
};

export default SRFsList;
