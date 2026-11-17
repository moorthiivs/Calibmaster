import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Filter, SlidersHorizontal } from "lucide-react";
import { Select } from "antd";

export default function DateRangeFilter({
  dateRange: range,
  setDateRange: setRange = () => { },
  singleDate,
  setSingleDate = () => { },
  selectedCustomer,
  setSelectedCustomer = () => { },
  enableSingle,
  setEnableSingle = () => { },
  enableCustomer,
  setEnableCustomer = () => { },
  enableQuickMenu,
  setEnableQuickMenu = () => { },
  customerList = [],
  onApplyFilter = () => { },
  onCustomizeClick
}) {
  const [dateOpen, setDateOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  
  const containerRef = useRef(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    return range?.from || new Date();
  });
  
  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDateOpen(false);
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formattedRange =
    range?.from && range?.to
      ? `${format(range.from, "dd MMM yyyy")} - ${format(
        range.to,
        "dd MMM yyyy"
      )}`
      : "Select Date Range";

  const displayValue =
    enableSingle && singleDate
      ? format(singleDate, "dd MMM yyyy")
      : formattedRange;

  const Toggle = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <button
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${checked ? "bg-blue-600" : "bg-gray-300"
          }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${checked ? "translate-x-5" : ""
            }`}
        />
      </button>
    </div>
  );

  const activeFilterCount = (() => {
    let count = 0;
    if (enableSingle && singleDate) count++;
    if (!enableSingle && range?.from && range?.to) count++;
    if (enableCustomer && selectedCustomer) count++;
    return count;
  })();

  const handleDateSelect = (val, selectedDay) => {
    if (enableSingle) {
      setRange(undefined);
      setSingleDate(selectedDay);
      setDateOpen(false);
    } else {
      setSingleDate(undefined);
      if (!range?.from) {
        setRange({ from: selectedDay, to: undefined });
      } else if (range.from && !range.to) {
        if (selectedDay.getTime() < range.from.getTime()) {
          setRange({ from: selectedDay, to: undefined });
        } else {
          setRange({ from: range.from, to: selectedDay });
          setDateOpen(false);
        }
      } else if (range.from && range.to) {
        setRange({ from: selectedDay, to: undefined });
      }
    }
  };

  return (
    <div className="relative flex gap-3" ref={containerRef}>

      {/* Date Display Button */}
      <div className="relative">
        <button
          onClick={() => {
            setDateOpen(!dateOpen);
            setFilterOpen(false);
          }}
          className="flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 
          bg-white border border-gray-200 
          rounded-xl text-sm font-medium w-full sm:w-auto
          shadow-sm hover:bg-gray-50 transition flex-1 sm:flex-none cursor-pointer"
        >
          <CalendarIcon size={16} className="text-gray-500 shrink-0" />
          <span className="truncate">{displayValue}</span>
        </button>

        {/* Date Picker Dropdown */}
        {dateOpen && (
          <div
            className="absolute left-0 top-14 w-auto
            backdrop-blur-xl bg-white/95 
            border border-gray-200 
            rounded-2xl shadow-xl   
            p-4 z-50"
          >
            <p className="text-sm font-semibold text-gray-800 mb-3">
              {enableSingle ? "Select Date" : "Select Date Range"}
            </p>
            <DayPicker
              mode={enableSingle ? "single" : "range"}
              selected={enableSingle ? singleDate : range}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              onSelect={handleDateSelect}
              classNames={{
                months: "text-sm",
                caption: "text-sm font-medium",
                nav_button: "h-6 w-6",
                table: "text-sm",
                head_cell: "text-xs font-medium text-gray-500",
                cell: "text-sm",
                day: "h-8 w-8 text-sm",
                day_selected: "bg-blue-600 text-white",
                day_today: "border border-blue-500",
              }}
            />
          </div>
        )}
      </div>

      {/* Filter Button */}
      <div className="relative">
        <button
          onClick={() => {
            setFilterOpen(!filterOpen);
            setDateOpen(false);
          }}
          className="flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 
          bg-gradient-to-r from-blue-600 to-indigo-600 
          text-white rounded-xl text-sm font-semibold w-full sm:w-auto
          shadow-lg shadow-blue-500/30 flex-1 sm:flex-none
          hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
        >
          <Filter size={16} className="shrink-0" />
          <span className="whitespace-nowrap">Filter Data</span>
          {activeFilterCount > 0 && (
            <span className="
        absolute -top-2 -right-2 sm:-right-1
        bg-red-500 text-white
        text-[10px] font-bold
        px-1.5 py-0.5
        rounded-full
        shadow-md
        animate-pulse
      ">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Filter Dropdown */}
        {filterOpen && (
          <div
            className="absolute right-0 top-14 w-[95vw] sm:w-[320px] max-w-[320px] 
            backdrop-blur-xl bg-white/95 
            border border-gray-200 
            rounded-2xl shadow-xl  
            p-4 sm:p-5 z-50 space-y-5"
          >
            {/* Enable Toggles */}
            <div className="space-y-4">
              <Toggle
                label="Enable Single Date"
                checked={enableSingle}
                onChange={() => {
                  setEnableSingle(!enableSingle);
                }}
              />
              <Toggle
                label="Enable Customer Filter"
                checked={enableCustomer}
                onChange={() => {
                  setEnableCustomer(!enableCustomer);
                }}
              />
              <Toggle
                label="Enable Quick Menu"
                checked={enableQuickMenu}
                onChange={() => setEnableQuickMenu(!enableQuickMenu)}
              />
            </div>

            {/* Apply Button */}
            <button
              onClick={() => {
                onApplyFilter();
                setFilterOpen(false);
              }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold 
              bg-gradient-to-r from-blue-600 to-indigo-600 
              text-white shadow-md shadow-blue-500/30 
              hover:scale-[1.02] active:scale-[0.98] 
              transition-all duration-200 cursor-pointer"
            >
              Apply Filter
            </button>

            {/* Customize Layout Button */}
            {onCustomizeClick && (
              <div className="border-t border-gray-100 pt-4 mt-2">
                <button
                  onClick={() => {
                    setFilterOpen(false);
                    onCustomizeClick();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold 
                  bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200/80
                  transition-all duration-200 cursor-pointer"
                >
                  <SlidersHorizontal size={14} className="text-gray-500 shrink-0" />
                  Customize Dashboard Layout
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Customer Select (shown outside when enabled) */}
      {enableCustomer && (
        <div className="relative min-w-[200px]">
          <Select
            showSearch
            placeholder="All Customers"
            className="w-full h-full min-h-[40px] [&_.ant-select-selector]:rounded-xl [&_.ant-select-selector]:border-gray-200"
            value={selectedCustomer || undefined}
            onChange={(val) => {
              setSelectedCustomer(val);
            }}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={customerList.map((c) => ({
              value: c.customer_id,
              label: c.customer_name,
            }))}
            allowClear
          />
        </div>
      )}
    </div>
  );
}