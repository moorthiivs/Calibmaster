import { quickMenuItems } from "./lib/data";
import { ArrowUpRight, ArrowDownRight, Users, UserPlus, Box, FileText, ClipboardCopy, BarChart as BarChartIcon, MoreHorizontal, ClipboardList, Clock, CheckCircle, Calendar, Calendar as CalendarIcon, ChevronRight, Filter } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { Tooltip as AntTooltip, Modal } from "antd";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";

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
  const Icon = Icons[name];

  if (!Icon) return null;

  return <Icon size={size} />;
};


export function Layout2({ cardsData, ChartData, recentActivities, enableQuickMenu, auth }) {
  const { timeRange, setTimeRange, data: linedata, plantwiseData, gaugewiseData } = ChartData
  const navigate = useNavigate();
  const [showAllMenu, setShowAllMenu] = useState(false);

  const [kpiModalOpen, setKpiModalOpen] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState([]);
  const [selectedKpiTitle, setSelectedKpiTitle] = useState("");
  const [selectedKpiTotal, setSelectedKpiTotal] = useState(0);


  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchText, setSearchText] = useState("");
  const totalValue = useMemo(() => {
    return gaugewiseData?.reduce(
      (sum, item) => sum + Number(item.value || 0),
      0
    );
  }, [gaugewiseData]);




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
    return quickMenuItems.filter(item =>
      !item.role || item.role.includes(auth.department)
    );
  }, [auth.department]);

  const visibleMenuItems = showAllMenu
    ? [...roleBasedMenu, { title: "Less", icon: "ChevronUp" }]
    : [...roleBasedMenu.slice(0, 5), { title: "More", icon: "ChevronDown" }];

  return (
    <div className="flex gap-8">
      {/* Main Content Area */}
      <div className="flex-1 space-y-8">

        {/* KPI Cards - Compact Row */}
        <div className="grid grid-cols-4 gap-4">
          {cardsData.map((card, i) => (
            <div key={i} className="bg-card rounded-xl p-5 border border-border shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{card.title}</h3>
                <div className={`text-white p-1.5 rounded-lg bg-gradient-to-br 
                      ${i === 0 ? 'from-blue-500 to-indigo-600' :
                    i === 1 ? 'from-amber-400 to-orange-500' :
                      i === 2 ? 'from-emerald-400 to-teal-500' : 'from-purple-500 to-pink-500'}
                    `}>
                  {/* {iconMap[card.icon]} */}
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
          ))}
        </div>

        {/* Charts - 2x2 Grid Style but modified for 3 charts */}
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2 bg-card rounded-xl border border-border shadow-sm p-5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-semibold text-base">Calibration Trend</h3>
              <select className="text-sm bg-secondary border-none rounded-md px-3 py-1.5 focus:ring-0 cursor-pointer text-muted-foreground font-medium" value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                <option value={6}>Last 6 Months</option>
                <option value={12}>This Year</option>
              </select>
            </div>
            <div className="h-[250px]">
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

          <div className="bg-card rounded-xl border border-border shadow-sm p-5">
            <h3 className="font-display font-semibold text-base mb-6">Plant Completion Status</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={plantwiseData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={<CustomYAxisTick />} width={60} />
                  <Tooltip cursor={{ fill: 'hsl(var(--secondary))' }} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-md)' }} />
                  <Bar dataKey="completed" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]} barSize={20} />
                  <Bar dataKey="pending" fill="var(--color-chart-4)" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm p-5 flex flex-col">
            <h3 className="font-display font-semibold text-base mb-2">Gauge Distribution</h3>
            <div className="h-[220px] flex-1 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gaugewiseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={4}
                  >
                    {gaugewiseData && gaugewiseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-md)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold">{totalValue}</span>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
            </div>
          </div>
        </div>

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
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
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
                  <tr key={i} className="hover:bg-secondary/30 transition-colors cursor-pointer group">
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
        <div className="w-72 flex-shrink-0 flex flex-col gap-6">
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
                    if (item.title === "More") {
                      setShowAllMenu(true);
                    } else if (item.title === "Less") {
                      setShowAllMenu(false);
                    } else {
                      navigate(item.link);
                    }
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/5 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-white/80 group-hover:text-white">
                      <RenderIcon name={item.icon} size={18} />
                    </div>

                    <span className="font-medium text-sm">{item.title}</span>
                  </div>

                  {(item.title === "More" || item.title === "Less") && (
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
          <h3 className="font-display font-semibold text-base mb-4">
            {selectedKpiTitle}
          </h3>

          <div className="w-full h-[320px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={selectedKpi.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="white"
                  strokeWidth={2}
                  cornerRadius={4}
                >
                  {selectedKpi.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px', border: '1px solid hsl(var(--border))',
                    boxShadow: 'var(--shadow-md)'
                  }}
                  formatter={(value, name, props) => [
                    `${value} (${((value / selectedKpiTotal) * 100).toFixed(1)}%)`,
                    props.payload.name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold">{selectedKpiTotal}</span>
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
          </div>
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
          <div className="flex gap-4 items-center">

            {/* Search */}
            <input
              type="text"
              placeholder="Search by SRF / Customer / Instrument"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm w-1/2"
            />

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm"
            >
              <option value="All">All Status</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
            </select>

          </div>

          {/* Table */}
          <div className="max-h-[400px] overflow-auto border border-border rounded-lg">
            <table className="w-full text-sm text-left">
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