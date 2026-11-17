import { quickMenuItems } from "./lib/data";
import { ArrowUpRight, ArrowDownRight, Users, UserPlus, Box, FileText, ClipboardCopy, BarChart as BarChartIcon, MoreHorizontal, ClipboardList, Clock, CheckCircle, Calendar, Calendar as CalendarIcon, ChevronRight, Filter, SlidersHorizontal } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { Tooltip as AntTooltip, Modal, Switch } from "antd";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import { sidebarConfig } from "../../Sidebar/sidebarConfig";
import ReusablePieChart from "./ReusablePieChart";
import ReusableBarChart from "./ReusableBarChart";

const CustomYAxisTick = ({ x, y, payload }) => {
  const fullName = payload.value;

  const plantMatch = fullName.match(/Plant-\d+/i);
  const shortName = plantMatch ? plantMatch[0] : fullName;

  return (
    <g transform={`translate(${x},${y})`}>
      <AntTooltip title={fullName} placement="right">
        <text
          x={0}
          y={0}
          dy={4}
          textAnchor="end"
          fill="hsl(var(--foreground))"
          fontSize={12}
          fontWeight={500}
          style={{ cursor: "pointer" }}
        >
          {shortName.toUpperCase()}
        </text>
      </AntTooltip>
    </g>
  );
};

const RenderIcon = ({ name, size = 18 }) => {
  if (!name) return null;

  // Handle case where name is a React component (from sidebarConfig)
  if (typeof name !== 'string') {
    const Icon = name;
    return <Icon size={size} />;
  }

  // Handle case where name is a string (from lucide-react)
  const Icon = Icons[name];
  if (!Icon) return null;

  return <Icon size={size} />;
};


export function Layout2({ cardsData, ChartData, recentActivities, enableQuickMenu, auth, effectiveDates, preferences }) {
  const { timeRange, setTimeRange, data: linedata, plantwiseData, gaugewiseData, masterEquipmentData } = ChartData
  const navigate = useNavigate();
  const [showAllMenu, setShowAllMenu] = useState(false);

  const [kpiModalOpen, setKpiModalOpen] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState([]);
  const [selectedKpiTitle, setSelectedKpiTitle] = useState("");
  const [selectedKpiTotal, setSelectedKpiTotal] = useState(0);
  const [selectedKpiType, setSelectedKpiType] = useState("");

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchText, setSearchText] = useState("");
  const totalValue = useMemo(() => {
    return gaugewiseData?.reduce(
      (sum, item) => sum + Number(item.value || 0),
      0
    );
  }, [gaugewiseData]);

  const masterEquipmentTotalValue = useMemo(() => {
    return masterEquipmentData?.reduce(
      (sum, item) => sum + Number(item.value || 0),
      0
    );
  }, [masterEquipmentData]);




  const filteredActivities = useMemo(() => {
    return recentActivities.filter((item) => {
      const matchStatus =
        statusFilter === "All" ? true : item.status === statusFilter;

      const matchSearch =
        item.customer.toLowerCase().includes(searchText.toLowerCase()) ||
        item.instrument.toLowerCase().includes(searchText.toLowerCase()) ||
        item.id.toLowerCase().includes(searchText.toLowerCase());

      return matchStatus && matchSearch;
    });
  }, [recentActivities, statusFilter, searchText]);


  const roleBasedMenu = useMemo(() => {
    if (!sidebarConfig) return [];

    // 1. Filter by permissions
    const filtered = sidebarConfig.filter(item =>
      !item.permission || (auth.permissions && auth.permissions.includes(item.permission))
    );

    // 2. Unique by group
    const uniqueGroups = [];
    const seenGroups = new Set();

    for (const item of filtered) {
      if (item.group && !seenGroups.has(item.group)) {
        uniqueGroups.push(item);
        seenGroups.add(item.group);
      }
    }

    return uniqueGroups;
  }, [auth.permissions]);

  const visibleMenuItems = showAllMenu
    ? [...roleBasedMenu, { group: "Less", icon: "ChevronUp" }]
    : [...roleBasedMenu.slice(0, 5), { group: "More", icon: "ChevronDown" }];

  const visibleCardsCount = useMemo(() => {
    return (cardsData || []).filter(card => preferences?.cards?.[card.title]).length;
  }, [cardsData, preferences]);

  const gridColClass = useMemo(() => {
    switch (visibleCardsCount) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-1 sm:grid-cols-2";
      case 3:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
      case 4:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
      case 5:
        return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5";
      case 6:
      default:
        return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6";
    }
  }, [visibleCardsCount]);

  return (
    <div className="flex flex-col xl:flex-row gap-8 w-full max-w-[100vw] overflow-x-hidden">
      {/* Main Content Area */}
      <div className="flex-1 space-y-6 w-full min-w-0">

        {/* KPI Cards - Compact Row */}
        <div className={`grid ${gridColClass} gap-4 w-full`}>
          {(cardsData || [])
            .filter(card => preferences.cards[card.title])
            .map((card, i) => (
              <div key={i} className="bg-card rounded-xl p-5 border border-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:border-border/80">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{card.title}</h3>
                  <div className={`text-white p-1.5 rounded-lg bg-gradient-to-br 
                        ${card.title === 'Total Calibrations' ? 'from-blue-500 to-indigo-600' :
                          card.title === 'Pending Calibrations' ? 'from-amber-400 to-orange-500' :
                          card.title === 'Certificates Generated' ? 'from-emerald-400 to-teal-500' :
                          card.title === 'Upcoming Due' ? 'from-purple-500 to-pink-500' :
                          card.title === 'Review Pending' ? 'from-red-500 to-rose-600' :
                          'from-cyan-500 to-blue-600'}
                      `}>
                    <RenderIcon name={card.icon} size={20} />
                  </div>
                </div>
                <div className="mt-2 cursor-pointer"
                  onClick={() => {
                    const numericData = card.alldata?.map(d => ({
                      ...d,
                      value: Number(d.value || 0)
                    })) || [];
                    setSelectedKpi(numericData);
                    setSelectedKpiTitle(card.title);
                    setSelectedKpiTotal(
                      numericData?.reduce((sum, d) => sum + (d.value || 0), 0)
                    );
                    // Map card title to a status filter value
                    const kpiTypeMap = {
                      "Total Calibrations": "",
                      "Pending Calibrations": "Not Calibrated",
                      "Certificates Generated": "Report Generated",
                      "Upcoming Due": "upcoming_due",
                      "Review Pending": "Review Pending",
                      "Auth Pending": "Auth Pending"
                    };
                    setSelectedKpiType(kpiTypeMap[card.title] || "");
                    setKpiModalOpen(true);
                  }}
                >
                  <p className="text-3xl font-display font-bold tracking-tight">{card.value}</p>
                  <div className={`flex items-center gap-1 text-xs mt-2 font-medium ${card.trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {card.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    <span>{card.trend} from last month</span>
                  </div>
                </div>
              </div>
            ))
          }
          {(cardsData || []).filter(card => preferences.cards[card.title]).length === 0 && (
            <div className="col-span-full py-8 text-center text-muted-foreground border border-dashed border-border rounded-xl bg-card/50">
              All KPI Scorecards are disabled. Click "Customize Layout" above to display them.
            </div>
          )}
        </div>

        {/* Charts Grid */}
        {Object.values(preferences.charts).filter(Boolean).length === 0 ? (
          <div className="py-16 text-center text-muted-foreground border border-dashed border-border rounded-2xl bg-card">
            All analytics charts are currently hidden. Click "Customize Layout" to choose which charts to display.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full animate-in fade-in duration-300">
            {preferences.charts["Calibration Trend"] && (
              <div className="bg-card rounded-xl border border-border shadow-sm p-5 flex flex-col hover:shadow-md transition-all">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-display font-semibold text-base">Calibration Trend</h3>
                  <select className="text-sm bg-secondary border-none rounded-md px-3 py-1.5 focus:ring-0 cursor-pointer text-muted-foreground font-medium" value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                    <option value={6}>Last 6 Months</option>
                    <option value={12}>This Year</option>
                  </select>
                </div>
                <div className="w-full h-[250px] sm:h-[300px] mt-4 min-w-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={linedata}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dx={-10} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-md)' }} />
                      <Line type="basis" dataKey="calibrations" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4, fill: "var(--color-background)", strokeWidth: 2 }} activeDot={{ r: 6, fill: "var(--color-primary)", stroke: "var(--color-background)" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {preferences.charts["Plant Completion Status"] && (
              <div className="bg-card rounded-xl border border-border shadow-sm p-5 flex flex-col hover:shadow-md transition-all">
                <ReusableBarChart
                  title="Plant Completion Status"
                  data={plantwiseData}
                  yAxisTick={<CustomYAxisTick />}
                  bars={[
                    { dataKey: "completed", fill: "var(--color-chart-2)" },
                    { dataKey: "pending", fill: "var(--color-chart-4)" }
                  ]}
                  onBarClick={(entry, dataKey) => {
                    const customer = entry?.name || "";
                    const statusMap = {
                      completed: "Report Generated",
                      pending: "Not Calibrated"
                    };
                    const status = statusMap[dataKey] || "";
                    const params = new URLSearchParams();
                    if (customer) params.set("customer", customer);
                    if (status) params.set("status", status);
                    navigate(`/dashboard/srf?${params.toString()}`);
                  }}
                />
              </div>
            )}

            {preferences.charts["Gauge Distribution"] && (
              <div className="bg-card rounded-xl border border-border shadow-sm p-5 flex flex-col hover:shadow-md transition-all">
                <ReusablePieChart
                  title="Gauge Distribution"
                  data={gaugewiseData}
                  totalValue={totalValue}
                  onSliceClick={(entry) => {
                    const customer = entry?.fullName || entry?.name || "";
                    const params = new URLSearchParams();
                    if (customer) params.set("customer", customer);
                    navigate(`/dashboard/srf?${params.toString()}`);
                  }}
                />
              </div>
            )}

            {preferences.charts["Master Equipment Category"] && (
              <div className="bg-card rounded-xl border border-border shadow-sm p-5 flex flex-col hover:shadow-md transition-all">
                <ReusableBarChart
                  title="Master Equipment Category"
                  data={masterEquipmentData}
                  yAxisTick={<CustomYAxisTick />}
                  bars={[
                    { dataKey: "value", fill: "var(--color-chart-2)" }
                  ]}
                  onBarClick={(entry) => {
                    const equipment = entry?.name || "";
                    const params = new URLSearchParams();
                    if (equipment) params.set("equipment", equipment);
                    navigate(`/dashboard/masters?${params.toString()}`);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Table - Full width below charts */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50 flex justify-between items-center">
            <h3 className="font-display font-semibold text-base">Recent SRF Activity</h3>
            <button
              onClick={() => setReportModalOpen(true)}
              className="text-xs font-medium text-primary flex items-center gap-1 hover:underline"
            >
              View full report <ChevronRight size={14} />
            </button>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm text-left min-w-[600px]">
              <thead className="text-xs text-muted-foreground bg-secondary/20">
                <tr>
                  <th className="px-5 py-3 font-medium border-b border-border/50">SRF No</th>
                  <th className="px-5 py-3 font-medium border-b border-border/50">Customer</th>
                  <th className="px-5 py-3 font-medium border-b border-border/50">Instrument</th>
                  <th className="px-5 py-3 font-medium border-b border-border/50">Status</th>
                  <th className="px-5 py-3 font-medium border-b border-border/50">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {recentActivities.map((activity, i) => (
                  <tr
                    key={i}
                    className="hover:bg-secondary/30 transition-colors cursor-pointer group"
                    onClick={() => {
                      const params = new URLSearchParams();
                      if (activity.srf_id) params.set("srfId", activity.srf_id);
                      if (activity.id) params.set("srfNumber", activity.id);
                      navigate(`/dashboard/srf?${params.toString()}`);
                    }}
                  >
                    <td className="px-5 py-3 font-medium text-primary group-hover:underline">{activity.id}</td>
                    <td className="px-5 py-3 font-medium">{activity.customer}</td>
                    <td className="px-5 py-3 text-muted-foreground">{activity.instrument}</td>
                    <td className="px-5 py-3">
                      <span className={`flex items-center gap-1.5 text-xs font-medium
                            ${activity.status === 'Completed' ? 'text-emerald-600' :
                          activity.status === 'Pending' ? 'text-rose-600' : 'text-amber-600'}
                          `}>
                        <div className={`w-1.5 h-1.5 rounded-full ${activity.status === 'Completed' ? 'bg-emerald-500' : activity.status === 'Pending' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                        {activity.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{activity.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>



        </div>


      </div>


      {/* Right Side Action Panel */}
      {enableQuickMenu && (
        <div className="w-full xl:w-72 flex-shrink-0 flex flex-col gap-6">
          <div className="bg-gradient-to-br from-sidebar to-sidebar-accent rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            <h3 className="font-display font-bold text-lg mb-1">Quick Actions</h3>
            <p className="text-white/70 text-sm mb-6 leading-relaxed">Access frequently used modules and tasks instantly.</p>

            <div className="space-y-3">
              {/* {quickMenuItems.map((item, i) => (
                <button key={i} onClick={() => navigate(item.link)} className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/5 group">
                  <div className="flex items-center gap-3">
                    <div className="text-white/80 group-hover:text-white">
                      {iconMap[item.icon]}
                    </div>
                    <span className="font-medium text-sm">{item.title}</span>
                  </div>
                  {item.title === 'More' ? (
                    <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center text-xs">
                      <ChevronRight size={14} />
                    </div>
                  ) : null}
                </button>
              ))} */}

              {visibleMenuItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (item.group === "More") {
                      setShowAllMenu(true);
                    } else if (item.group === "Less") {
                      setShowAllMenu(false);
                    } else {
                      navigate(item.key || item.link);
                    }
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/5 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-white/80 group-hover:text-white">
                      <RenderIcon name={item.icon} size={18} />
                    </div>

                    <span className="font-medium text-sm">{item.group}</span>
                  </div>

                  {(item.group === "More" || item.group === "Less") && (
                    <ChevronRight size={14} />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border shadow-sm rounded-xl p-5">
            <h3 className="font-display font-semibold text-sm mb-4">System Alerts</h3>
            <div className="space-y-4">
              <div className="flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Server Sync Error</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Plant-2 master data sync failed 2 mins ago.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Backup Complete</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Database backup successful.</p>
                </div>
              </div>
            </div>
            <button className="w-full mt-5 py-2 text-xs font-medium text-center text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors">
              View All Notifications
            </button>
          </div>
        </div>
      )}


      <Modal
        open={kpiModalOpen}
        onCancel={() => setKpiModalOpen(false)}
        footer={null}
        width={600}
        centered
        title={`${selectedKpiTitle || "KPI"} Breakdown`}
      >
        <div className="p-6 flex flex-col items-center">
          <ReusablePieChart
            title={selectedKpiTitle}
            wrapperClassName="items-center"
            containerClassName="w-full h-[320px]"
            data={selectedKpi.filter(d => d.value > 0)}
            innerRadius={70}
            outerRadius={110}
            paddingAngle={3}
            stroke="white"
            strokeWidth={2}
            totalValue={selectedKpiTotal}
            valueSize="text-3xl"
            labelSize="text-sm"
            tooltipFormatter={(value, name, props) => [
              `${value} (${((value / selectedKpiTotal) * 100).toFixed(1)}%)`,
              props.payload.name,
            ]}
            onSliceClick={(entry) => {
              const customer = entry?.name || "";
              const params = new URLSearchParams();
              if (customer) params.set("customer", customer);
              if (selectedKpiType) params.set("status", selectedKpiType);
              if (effectiveDates?.fromDate) params.set("fromDate", effectiveDates.fromDate);
              if (effectiveDates?.toDate) params.set("toDate", effectiveDates.toDate);
              setKpiModalOpen(false);
              navigate(`/dashboard/srf?${params.toString()}`);
            }}
          />
        </div>
      </Modal>




      <Modal
        open={reportModalOpen}
        onCancel={() => setReportModalOpen(false)}
        footer={null}
        width={1200}
        centered
        title="Full SRF Activity Report"
      >
        <div className="p-4 space-y-4">

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center w-full">

            {/* Search */}
            <input
              type="text"
              placeholder="Search by SRF / Customer / Instrument"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm w-full sm:w-1/2"
            />

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm w-full sm:w-auto"
            >
              <option value="All">All Status</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
            </select>

          </div>

          {/* Table */}
          <div className="max-h-[400px] overflow-auto border border-border rounded-lg w-full">
            <table className="w-full text-sm text-left min-w-[600px]">
              <thead className="text-xs text-muted-foreground bg-secondary/20 sticky top-0">
                <tr>
                  <th className="px-4 py-3">SRF No</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Instrument</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredActivities.map((activity, i) => (
                  <tr key={i} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-primary">{activity.id}</td>
                    <td className="px-4 py-3">{activity.customer}</td>
                    <td className="px-4 py-3 text-muted-foreground">{activity.instrument}</td>
                    <td className="px-5 py-3">
                      <span className={`flex items-center gap-1.5 text-xs font-medium
                            ${activity.status === 'Completed' ? 'text-emerald-600' :
                          activity.status === 'Pending' ? 'text-rose-600' : 'text-amber-600'}
                          `}>
                        <div className={`w-1.5 h-1.5 rounded-full ${activity.status === 'Completed' ? 'bg-emerald-500' : activity.status === 'Pending' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                        {activity.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{activity.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </Modal>
    </div>
  );
}