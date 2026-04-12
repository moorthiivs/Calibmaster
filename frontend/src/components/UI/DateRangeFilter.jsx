import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Filter } from "lucide-react";

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
  onApplyFilter = () => { }
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    return range?.from || new Date();
  });
  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
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

    // Date Filter
    if (enableSingle && singleDate) count++;
    if (!enableSingle && range?.from && range?.to) count++;

    // Customer Filter
    if (enableCustomer && selectedCustomer) count++;

    // Quick Menu
    //if (enableQuickMenu) count++;

    return count;
  })();
  return (
    <div className="relative flex gap-3" ref={dropdownRef}>

      {/* Date Display Button */}
      <button
        className="flex items-center gap-2 px-5 py-2.5 
        bg-white border border-gray-200 
        rounded-xl text-sm font-medium 
        shadow-sm hover:bg-gray-50 transition"
      >
        <CalendarIcon size={16} className="text-gray-500" />
        {displayValue}
      </button>

      {/* Filter Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-5 py-2.5 
        bg-gradient-to-r from-blue-600 to-indigo-600 
        text-white rounded-xl text-sm font-semibold 
        shadow-lg shadow-blue-500/30 
        hover:scale-105 active:scale-95 transition-all duration-200"
      >
        <Filter size={16} />
        Filter Data
        {activeFilterCount > 0 && (
          <span className="
      absolute -top-2 -right-2
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

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-16 w-[400px] 
          backdrop-blur-xl bg-white/90 
          border border-gray-200 
          rounded-2xl   
          p-6 z-50 space-y-6"
        >
          {/* Enable Toggles */}
          <div className="border-b pb-4 space-y-4">
            <Toggle
              label="Enable Single Date"
              checked={enableSingle}
              onChange={() => setEnableSingle(!enableSingle)}
            />
            <Toggle
              label="Enable Customer Filter"
              checked={enableCustomer}
              onChange={() => setEnableCustomer(!enableCustomer)}
            />
            <Toggle
              label="Enable Quick Menu"
              checked={enableQuickMenu}
              onChange={() => setEnableQuickMenu(!enableQuickMenu)}
            />
          </div>

          {/* Date Picker */}
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-3">
              {enableSingle ? "Select Date" : "Select Date Range"}
            </p>

            <DayPicker
              mode={enableSingle ? "single" : "range"}
              selected={enableSingle ? singleDate : range}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              onSelect={(val, selectedDay) => {
                if (enableSingle) {
                  setRange(undefined);
                  setSingleDate(selectedDay);
                } else {
                  setSingleDate(undefined);
                  if (!range?.from) {
                    setRange({ from: selectedDay, to: undefined });
                  } else if (range.from && !range.to) {
                    if (selectedDay.getTime() < range.from.getTime()) {
                      setRange({ from: selectedDay, to: undefined });
                    } else {
                      setRange({ from: range.from, to: selectedDay });
                    }
                  } else if (range.from && range.to) {
                    setRange({ from: selectedDay, to: undefined });
                  }
                }
              }}
              classNames={{
                months: "text-sm",
                caption: "text-sm font-medium",
                nav_button: "h-6 w-6",
                table: "text-sm",
                head_cell: "text-xs font-medium text-gray-500",
                cell: "text-sm",
                day: "h-3 w-50 text-sm",
                day_selected: "bg-blue-600 text-white",
                day_today: "border border-blue-500",
              }}
            />
          </div>

          {/* Customer Select */}
          {enableCustomer && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-800">
                Select Customer
              </p>

              <div className="relative">
                <select
                  value={selectedCustomer ?? ""}
                  onChange={(e) =>
                    setSelectedCustomer(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                  className="
          w-full appearance-none
          bg-white
          border border-gray-200
          rounded-xl
          px-4 py-3 pr-10
          text-sm font-medium text-gray-700
          shadow-sm
          transition-all duration-200
          hover:border-blue-400
          focus:outline-none
          focus:ring-2 focus:ring-blue-500/40
          focus:border-blue-500
        "
                >
                  <option value="">All Customers</option>
                  {customerList.map((c) => (
                    <option key={c.customer_id} value={c.customer_id}>
                      {c.customer_name}
                    </option>
                  ))}
                </select>

                {/* Custom Arrow */}
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          )}


          {/* Apply Button */}
          <button
            onClick={() => {
              console.log({
                range,
                singleDate,
                selectedCustomer,
              });
              onApplyFilter();
              setOpen(false);
            }}
            className="w-full py-3 rounded-xl text-sm font-semibold 
            bg-linear-to-r from-blue-600 to-indigo-600 
            text-white shadow-lg shadow-blue-500/30 
            hover:scale-[1.02] active:scale-[0.98] 
            transition-all duration-200"
          >
            Apply Filter
          </button>
        </div>
      )}
    </div>
  );
}
