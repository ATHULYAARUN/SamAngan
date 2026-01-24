import React, { useState, useEffect, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Baby,
  Target,
  Award,
  AlertTriangle,
  BarChart3,
  Activity,
  Users,
  CalendarDays,
  Percent,
  Timer,
  Download,
  FileText,
  PieChart,
  Filter,
  Eye,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import parentService from '../../services/parentService';

const ParentAttendanceTracker = () => {
  const [children, setChildren] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(new Date().getMonth());
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('overview');

  // Generate attendance data for a specific child
  const generateAttendanceForChild = useCallback((child) => {
    const currentDate = new Date();
    const attendanceRecords = [];
    const monthlyStats = {};
    
    // Generate data for last 6 months
    for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
      const targetMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - monthOffset, 1);
      const monthKey = `${targetMonth.getFullYear()}-${(targetMonth.getMonth() + 1).toString().padStart(2, '0')}`;
      
      const daysInMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
      let presentDays = 0;
      let absentDays = 0;
      let totalDays = 0;
      
      // Generate daily attendance for the month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), day);
        
        // Skip future dates
        if (date > currentDate) continue;
        
        // Skip weekends (Saturday = 6, Sunday = 0)
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        totalDays++;
        
        // Generate realistic attendance (85-95% attendance rate)
        const isPresent = Math.random() > (child.name === 'Aarav Arun' ? 0.1 : 0.15); // Aarav has slightly better attendance
        
        if (isPresent) {
          presentDays++;
        } else {
          absentDays++;
        }
        
        attendanceRecords.push({
          id: `${child.id}-${date.toISOString().split('T')[0]}`,
          childId: child.id,
          date: date.toISOString().split('T')[0],
          status: isPresent ? 'present' : 'absent',
          timeIn: isPresent ? '09:00' : null,
          timeOut: isPresent ? '16:00' : null,
          notes: isPresent ? null : (Math.random() > 0.7 ? 'Sick leave' : 'Family emergency')
        });
      }
      
      monthlyStats[monthKey] = {
        month: targetMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        totalDays,
        presentDays,
        absentDays,
        attendanceRate: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
      };
    }
    
    // Calculate current month attendance
    const currentMonthKey = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
    const currentMonthData = monthlyStats[currentMonthKey] || { attendanceRate: 0, presentDays: 0, totalDays: 0 };
    
    return {
      attendanceRecords: attendanceRecords.reverse(), // Most recent first
      monthlyStats,
      currentMonthAttendance: currentMonthData.attendanceRate,
      totalPresent: currentMonthData.presentDays,
      totalDays: currentMonthData.totalDays,
      weeklyTrend: generateWeeklyTrend(attendanceRecords)
    };
  }, []);

  // Generate weekly attendance trend
  const generateWeeklyTrend = (records) => {
    const weeks = [];
    const today = new Date();
    
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (i * 7) - today.getDay());
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekRecords = records.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= weekStart && recordDate <= weekEnd;
      });
      
      const presentCount = weekRecords.filter(r => r.status === 'present').length;
      const totalCount = weekRecords.length;
      
      weeks.unshift({
        week: `Week ${4 - i}`,
        attendanceRate: totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0,
        presentDays: presentCount,
        totalDays: totalCount
      });
    }
    
    return weeks;
  };

  // Load attendance data
  useEffect(() => {
    const loadAttendanceData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get children data from parentService
        const stats = await parentService.getParentStats();
        
        if (stats && stats.children && stats.children.length > 0) {
          setChildren(stats.children);
          
          // Generate attendance data for each child
          const attendanceMap = {};
          stats.children.forEach(child => {
            attendanceMap[child.id] = generateAttendanceForChild(child);
          });
          setAttendanceData(attendanceMap);
          
        } else {
          setError('No children found');
        }
        
      } catch (error) {
        console.error('Error loading attendance data:', error);
        setError('Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    };

    loadAttendanceData();
  }, [generateAttendanceForChild]); // Only depends on generateAttendanceForChild

  // Render attendance calendar for a child
  const renderAttendanceCalendar = (child) => {
    const childAttendance = attendanceData[child.id] || {};
    const currentDate = new Date();
    const calendarDate = new Date(selectedYear, selectedMonth, 1);
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDayOfWeek = calendarDate.getDay();
    
    const monthRecords = (childAttendance.attendanceRecords || []).filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear;
    });
    
    const getDayStatus = (day) => {
      const dayDate = new Date(selectedYear, selectedMonth, day);
      const record = monthRecords.find(r => new Date(r.date).getDate() === day);
      
      if (dayDate > currentDate) return 'future';
      if (dayDate.getDay() === 0 || dayDate.getDay() === 6) return 'weekend';
      if (!record) return 'no-data';
      return record.status;
    };
    
    const calendarDays = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDayOfWeek; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="p-2"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const status = getDayStatus(day);
      const dayDate = new Date(selectedYear, selectedMonth, day);
      const isToday = dayDate.toDateString() === currentDate.toDateString();
      
      calendarDays.push(
        <div
          key={day}
          className={`p-2 text-center text-sm relative ${
            status === 'present' ? 'bg-green-100 text-green-800' :
            status === 'absent' ? 'bg-red-100 text-red-800' :
            status === 'weekend' ? 'bg-gray-100 text-gray-500' :
            status === 'future' ? 'bg-gray-50 text-gray-400' :
            'bg-yellow-100 text-yellow-800'
          } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
        >
          <span className="font-medium">{day}</span>
          {status === 'present' && <CheckCircle className="w-3 h-3 absolute top-0 right-0 text-green-600" />}
          {status === 'absent' && <XCircle className="w-3 h-3 absolute top-0 right-0 text-red-600" />}
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-lg p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays}
        </div>
      </div>
    );
  };

  // Render overview with statistics
  const renderOverview = () => (
    <div className="space-y-8">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Children</p>
              <p className="text-3xl font-bold">{children.length}</p>
            </div>
            <Users className="w-12 h-12 text-blue-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Average Attendance</p>
              <p className="text-3xl font-bold">
                {children.length > 0 
                  ? Math.round(Object.values(attendanceData).reduce((sum, data) => sum + (data.currentMonthAttendance || 0), 0) / children.length)
                  : 0}%
              </p>
            </div>
            <Percent className="w-12 h-12 text-green-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100">Days Present</p>
              <p className="text-3xl font-bold">
                {Object.values(attendanceData).reduce((sum, data) => sum + (data.totalPresent || 0), 0)}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-yellow-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">This Month</p>
              <p className="text-3xl font-bold">
                {Object.values(attendanceData).reduce((sum, data) => sum + (data.totalDays || 0), 0)} days
              </p>
            </div>
            <Calendar className="w-12 h-12 text-purple-200" />
          </div>
        </motion.div>
      </div>

      {/* Individual Child Attendance Cards */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">Individual Attendance Records</h3>
        <div className="grid grid-cols-1 gap-6">
          {children.map(child => {
            const childAttendance = attendanceData[child.id] || {};
            
            return (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
              >
                {/* Child Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                      <Baby className="w-6 h-6 text-pink-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{child.name}</h4>
                      <p className="text-sm text-gray-600">{child.age} • {child.anganwadiCenter}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">This Month</p>
                    <div className="flex items-center space-x-2">
                      <span className={`text-2xl font-bold ${
                        (childAttendance.currentMonthAttendance || 0) >= 90 ? 'text-green-600' :
                        (childAttendance.currentMonthAttendance || 0) >= 75 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {childAttendance.currentMonthAttendance || 0}%
                      </span>
                      {(childAttendance.currentMonthAttendance || 0) >= 85 ? (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Attendance Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Present</p>
                    <p className="text-xl font-bold text-green-600">{childAttendance.totalPresent || 0}</p>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Absent</p>
                    <p className="text-xl font-bold text-red-600">
                      {(childAttendance.totalDays || 0) - (childAttendance.totalPresent || 0)}
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Total Days</p>
                    <p className="text-xl font-bold text-blue-600">{childAttendance.totalDays || 0}</p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Target</p>
                    <p className="text-xl font-bold text-purple-600">90%</p>
                  </div>
                </div>

                {/* Weekly Trend */}
                <div className="mb-6">
                  <h6 className="font-semibold text-gray-900 mb-3">Weekly Attendance Trend</h6>
                  <div className="grid grid-cols-4 gap-4">
                    {(childAttendance.weeklyTrend || []).map((week, index) => (
                      <div key={index} className="text-center">
                        <div className={`h-16 w-full rounded-lg flex items-end justify-center ${
                          week.attendanceRate >= 90 ? 'bg-green-100' :
                          week.attendanceRate >= 75 ? 'bg-yellow-100' :
                          'bg-red-100'
                        }`}>
                          <div 
                            className={`w-full rounded-lg ${
                              week.attendanceRate >= 90 ? 'bg-green-500' :
                              week.attendanceRate >= 75 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ height: `${week.attendanceRate}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{week.week}</p>
                        <p className="text-sm font-medium">{week.attendanceRate}%</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance Indicator */}
                <div className={`p-4 rounded-lg ${
                  (childAttendance.currentMonthAttendance || 0) >= 90 
                    ? 'bg-green-50 border border-green-200' 
                    : (childAttendance.currentMonthAttendance || 0) >= 75 
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center">
                    {(childAttendance.currentMonthAttendance || 0) >= 90 ? (
                      <Award className="w-5 h-5 text-green-600 mr-3" />
                    ) : (childAttendance.currentMonthAttendance || 0) >= 75 ? (
                      <Clock className="w-5 h-5 text-yellow-600 mr-3" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                    )}
                    <div>
                      <p className={`font-medium ${
                        (childAttendance.currentMonthAttendance || 0) >= 90 
                          ? 'text-green-800' 
                          : (childAttendance.currentMonthAttendance || 0) >= 75 
                          ? 'text-yellow-800'
                          : 'text-red-800'
                      }`}>
                        {(childAttendance.currentMonthAttendance || 0) >= 90 
                          ? 'Excellent Attendance!' 
                          : (childAttendance.currentMonthAttendance || 0) >= 75 
                          ? 'Good Attendance'
                          : 'Needs Improvement'}
                      </p>
                      <p className={`text-sm ${
                        (childAttendance.currentMonthAttendance || 0) >= 90 
                          ? 'text-green-600' 
                          : (childAttendance.currentMonthAttendance || 0) >= 75 
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}>
                        {(childAttendance.currentMonthAttendance || 0) >= 90 
                          ? 'Keep up the great work!' 
                          : (childAttendance.currentMonthAttendance || 0) >= 75 
                          ? 'Try to maintain regular attendance'
                          : 'Please ensure regular attendance for better development'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Generate PDF report
  const generatePDFReport = useCallback((reportData, month, year) => {
    const doc = new jsPDF();
    const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    // Calculate overall statistics
    const overallStats = {
      totalChildren: Object.keys(reportData).length,
      averageAttendance: Object.values(reportData).length > 0 
        ? Math.round(Object.values(reportData).reduce((sum, data) => sum + data.attendanceRate, 0) / Object.values(reportData).length)
        : 0,
      totalPresent: Object.values(reportData).reduce((sum, data) => sum + data.presentDays, 0),
      totalAbsent: Object.values(reportData).reduce((sum, data) => sum + data.absentDays, 0),
      totalSickLeaves: Object.values(reportData).reduce((sum, data) => sum + (data.sickLeaves || 0), 0)
    };

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 44, 52);
    doc.text('Monthly Attendance Report', 20, 25);
    
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text(`${monthName} - Anganwadi Center Report`, 20, 35);
    
    // Parent information
    doc.setFontSize(12);
    doc.text(`Parent: ${localStorage.getItem('userName') || 'Lekha Arun'}`, 20, 45);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 52);
    
    // Overall Statistics Section
    doc.setFontSize(16);
    doc.setTextColor(40, 44, 52);
    doc.text('Overall Statistics', 20, 70);
    
    const overallData = [
      ['Metric', 'Value'],
      ['Total Children Tracked', overallStats.totalChildren.toString()],
      ['Average Attendance Rate', `${overallStats.averageAttendance}%`],
      ['Total Present Days', overallStats.totalPresent.toString()],
      ['Total Absent Days', overallStats.totalAbsent.toString()],
      ['Health-related Absences', overallStats.totalSickLeaves.toString()]
    ];
    
    autoTable(doc, {
      head: [overallData[0]],
      body: overallData.slice(1),
      startY: 75,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: 20, right: 20 }
    });
    
    let currentY = doc.lastAutoTable.finalY + 20;
    
    // Individual Child Reports
    Object.entries(reportData).forEach(([, data]) => {
      // Check if we need a new page
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      // Child Header
      doc.setFontSize(14);
      doc.setTextColor(40, 44, 52);
      doc.text(`${data.childName} (${data.childAge})`, 20, currentY);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`${data.anganwadiCenter}`, 20, currentY + 7);
      
      // Child Statistics Table
      const childData = [
        ['Metric', 'Value', 'Status'],
        ['Attendance Rate', `${data.attendanceRate}%`, data.attendanceRate >= 90 ? 'Excellent' : data.attendanceRate >= 75 ? 'Good' : 'Needs Improvement'],
        ['Present Days', data.presentDays.toString(), ''],
        ['Absent Days', data.absentDays.toString(), ''],
        ['Sick Leaves', (data.sickLeaves || 0).toString(), ''],
        ['Punctuality Score', `${data.punctualityScore}%`, ''],
        ['Behavior Rating', data.behaviorRating, '']
      ];
      
      autoTable(doc, {
        head: [childData[0]],
        body: childData.slice(1),
        startY: currentY + 15,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [236, 72, 153] },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 30 },
          2: { cellWidth: 60 }
        }
      });
      
      currentY = doc.lastAutoTable.finalY + 5;
      
      // Weekly Breakdown
      if (data.weeklyBreakdown && data.weeklyBreakdown.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(40, 44, 52);
        doc.text('Weekly Breakdown', 20, currentY + 10);
        
        const weeklyData = [
          ['Week', 'Present Days', 'Total Days', 'Attendance Rate']
        ];
        
        data.weeklyBreakdown.forEach(week => {
          weeklyData.push([
            `Week ${week.week}`,
            week.presentDays.toString(),
            week.totalDays.toString(),
            `${week.attendanceRate}%`
          ]);
        });
        
        autoTable(doc, {
          head: [weeklyData[0]],
          body: weeklyData.slice(1),
          startY: currentY + 15,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [34, 197, 94] },
          margin: { left: 20, right: 20 }
        });
        
        currentY = doc.lastAutoTable.finalY + 10;
      }
      
      // Recommendations
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(12);
      doc.setTextColor(40, 44, 52);
      doc.text('Recommendations', 20, currentY);
      
      let recommendation = '';
      if (data.attendanceRate >= 90) {
        recommendation = `${data.childName} has excellent attendance. Continue the great work!`;
      } else if (data.attendanceRate >= 75) {
        recommendation = `${data.childName} is doing well. Aim for 90% attendance for optimal development.`;
      } else {
        recommendation = `${data.childName} needs more regular attendance. Please consult with the Anganwadi worker.`;
      }
      
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const splitRecommendation = doc.splitTextToSize(recommendation, 170);
      doc.text(splitRecommendation, 20, currentY + 10);
      
      currentY += 25 + (splitRecommendation.length * 4);
    });
    
    // Footer with summary
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(14);
    doc.setTextColor(40, 44, 52);
    doc.text('Report Summary', 20, currentY);
    
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    
    let summaryText = '';
    if (overallStats.averageAttendance >= 90) {
      summaryText = 'Excellent family commitment to education with outstanding attendance rates. Keep up the excellent work!';
    } else if (overallStats.averageAttendance >= 75) {
      summaryText = 'Good attendance patterns with room for consistency improvement. Consider strategies to reach 90% attendance.';
    } else {
      summaryText = 'Attendance needs attention. Please discuss any barriers with the Anganwadi staff for support and solutions.';
    }
    
    const splitSummary = doc.splitTextToSize(summaryText, 170);
    doc.text(splitSummary, 20, currentY + 10);
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount}`, 20, doc.internal.pageSize.height - 10);
      doc.text('Generated by Sampoorna Aangan System', doc.internal.pageSize.width - 80, doc.internal.pageSize.height - 10);
    }
    
    // Save the PDF
    const fileName = `Attendance_Report_${monthName.replace(' ', '_')}_${localStorage.getItem('userName')?.replace(' ', '_') || 'Parent'}.pdf`;
    doc.save(fileName);
  }, []);

  // Generate detailed monthly report for a specific month/year
  const generateMonthlyReport = useCallback((month, year) => {
    const reportData = {};
    
    children.forEach(child => {
      const childAttendance = attendanceData[child.id] || {};
      const monthKey = `${year}-${(month + 1).toString().padStart(2, '0')}`;
      const monthlyStats = childAttendance.monthlyStats?.[monthKey];
      
      if (monthlyStats) {
        const records = (childAttendance.attendanceRecords || []).filter(record => {
          const recordDate = new Date(record.date);
          return recordDate.getMonth() === month && recordDate.getFullYear() === year;
        });
        
        // Calculate additional metrics
        const absentRecords = records.filter(r => r.status === 'absent');
        const sickLeaves = absentRecords.filter(r => r.notes && r.notes.includes('Sick')).length;
        const familyEmergencies = absentRecords.filter(r => r.notes && r.notes.includes('Family')).length;
        
        // Calculate weekly breakdown
        const weeklyBreakdown = [];
        for (let week = 0; week < 5; week++) {
          const weekStart = new Date(year, month, week * 7 + 1);
          const weekEnd = new Date(year, month, (week + 1) * 7);
          
          const weekRecords = records.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate >= weekStart && recordDate <= weekEnd;
          });
          
          if (weekRecords.length > 0) {
            const weekPresent = weekRecords.filter(r => r.status === 'present').length;
            weeklyBreakdown.push({
              week: week + 1,
              totalDays: weekRecords.length,
              presentDays: weekPresent,
              attendanceRate: Math.round((weekPresent / weekRecords.length) * 100)
            });
          }
        }
        
        reportData[child.id] = {
          ...monthlyStats,
          childName: child.name,
          childAge: child.age,
          anganwadiCenter: child.anganwadiCenter,
          sickLeaves,
          familyEmergencies,
          weeklyBreakdown,
          averageTimeIn: '09:00',
          averageTimeOut: '16:00',
          punctualityScore: Math.random() > 0.2 ? 95 : 85, // Random punctuality score
          behaviorRating: Math.random() > 0.3 ? 'Excellent' : 'Good'
        };
      }
    });
    
    return reportData;
  }, [children, attendanceData]);

  // Render monthly reports view
  const renderMonthlyReports = () => {
    const reportData = generateMonthlyReport(reportMonth, reportYear);
    const monthName = new Date(reportYear, reportMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    // Calculate overall statistics
    const overallStats = {
      totalChildren: Object.keys(reportData).length,
      averageAttendance: Object.values(reportData).length > 0 
        ? Math.round(Object.values(reportData).reduce((sum, data) => sum + data.attendanceRate, 0) / Object.values(reportData).length)
        : 0,
      totalPresent: Object.values(reportData).reduce((sum, data) => sum + data.presentDays, 0),
      totalAbsent: Object.values(reportData).reduce((sum, data) => sum + data.absentDays, 0),
      totalSickLeaves: Object.values(reportData).reduce((sum, data) => sum + (data.sickLeaves || 0), 0)
    };

    return (
      <div className="space-y-8">
        {/* Report Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Monthly Attendance Report</h3>
            <p className="text-gray-600">Detailed analysis and insights for {monthName}</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Month/Year Selector */}
            <select
              value={reportMonth}
              onChange={(e) => setReportMonth(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={reportYear}
              onChange={(e) => setReportYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              {[2024, 2025].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            
            {/* Download Button */}
            <button 
              onClick={() => {
                console.log('📥 Download PDF button clicked');
                console.log('Report data:', reportData);
                console.log('Report month:', reportMonth, 'Report year:', reportYear);
                try {
                  generatePDFReport(reportData, reportMonth, reportYear);
                  console.log('✅ PDF generation completed');
                } catch (error) {
                  console.error('❌ PDF generation error:', error);
                  alert('Error generating PDF: ' + error.message);
                }
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Children Tracked</p>
                <p className="text-3xl font-bold">{overallStats.totalChildren}</p>
              </div>
              <Users className="w-12 h-12 text-blue-200" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Average Attendance</p>
                <p className="text-3xl font-bold">{overallStats.averageAttendance}%</p>
                <p className="text-sm text-green-100 flex items-center">
                  {overallStats.averageAttendance >= 85 ? (
                    <ArrowUp className="w-3 h-3 mr-1" />
                  ) : (
                    <ArrowDown className="w-3 h-3 mr-1" />
                  )}
                  {overallStats.averageAttendance >= 85 ? 'Above target' : 'Below target'}
                </p>
              </div>
              <Percent className="w-12 h-12 text-green-200" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100">Total Present</p>
                <p className="text-3xl font-bold">{overallStats.totalPresent}</p>
                <p className="text-sm text-yellow-100">vs {overallStats.totalAbsent} absent</p>
              </div>
              <CheckCircle className="w-12 h-12 text-yellow-200" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-6 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100">Sick Leaves</p>
                <p className="text-3xl font-bold">{overallStats.totalSickLeaves}</p>
                <p className="text-sm text-red-100">Health-related absences</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-200" />
            </div>
          </motion.div>
        </div>

        {/* Detailed Reports for Each Child */}
        <div className="space-y-6">
          <h4 className="text-xl font-semibold text-gray-900">Individual Child Reports</h4>
          
          {Object.entries(reportData).map(([childId, data]) => (
            <motion.div
              key={childId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
            >
              {/* Child Report Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                    <Baby className="w-6 h-6 text-pink-600" />
                  </div>
                  <div>
                    <h5 className="text-lg font-semibold text-gray-900">{data.childName}</h5>
                    <p className="text-sm text-gray-600">{data.childAge} • {data.anganwadiCenter}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Attendance Rate</p>
                    <p className={`text-2xl font-bold ${
                      data.attendanceRate >= 90 ? 'text-green-600' :
                      data.attendanceRate >= 75 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {data.attendanceRate}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Punctuality</p>
                    <p className="text-2xl font-bold text-blue-600">{data.punctualityScore}%</p>
                  </div>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Present Days</p>
                  <p className="text-xl font-bold text-green-600">{data.presentDays}</p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Absent Days</p>
                  <p className="text-xl font-bold text-red-600">{data.absentDays}</p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Sick Leaves</p>
                  <p className="text-xl font-bold text-yellow-600">{data.sickLeaves || 0}</p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Total Days</p>
                  <p className="text-xl font-bold text-blue-600">{data.totalDays}</p>
                </div>
              </div>

              {/* Weekly Breakdown Chart */}
              <div className="mb-6">
                <h6 className="font-semibold text-gray-900 mb-3">Weekly Breakdown</h6>
                <div className="grid grid-cols-5 gap-4">
                  {data.weeklyBreakdown.map((week, index) => (
                    <div key={index} className="text-center">
                      <div className="h-24 bg-gray-100 rounded-lg flex items-end justify-center p-2">
                        <div 
                          className={`w-full rounded ${
                            week.attendanceRate >= 90 ? 'bg-green-500' :
                            week.attendanceRate >= 75 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ height: `${week.attendanceRate}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Week {week.week}</p>
                      <p className="text-sm font-medium">{week.attendanceRate}%</p>
                      <p className="text-xs text-gray-400">{week.presentDays}/{week.totalDays}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Attendance Pattern */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h6 className="font-semibold text-gray-900 mb-3">Attendance Pattern</h6>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Time In:</span>
                      <span className="font-medium">{data.averageTimeIn}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Time Out:</span>
                      <span className="font-medium">{data.averageTimeOut}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Punctuality Score:</span>
                      <span className="font-medium text-blue-600">{data.punctualityScore}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Behavior Rating:</span>
                      <span className="font-medium text-green-600">{data.behaviorRating}</span>
                    </div>
                  </div>
                </div>

                {/* Absence Analysis */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h6 className="font-semibold text-gray-900 mb-3">Absence Analysis</h6>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Absences:</span>
                      <span className="font-medium">{data.absentDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sick Leaves:</span>
                      <span className="font-medium text-yellow-600">{data.sickLeaves || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Family Emergencies:</span>
                      <span className="font-medium text-orange-600">{data.familyEmergencies || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Other Reasons:</span>
                      <span className="font-medium text-gray-600">
                        {data.absentDays - (data.sickLeaves || 0) - (data.familyEmergencies || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className={`mt-6 p-4 rounded-lg ${
                data.attendanceRate >= 90 
                  ? 'bg-green-50 border border-green-200' 
                  : data.attendanceRate >= 75 
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start">
                  {data.attendanceRate >= 90 ? (
                    <Award className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                  ) : data.attendanceRate >= 75 ? (
                    <Target className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-medium ${
                      data.attendanceRate >= 90 
                        ? 'text-green-800' 
                        : data.attendanceRate >= 75 
                        ? 'text-yellow-800'
                        : 'text-red-800'
                    }`}>
                      {data.attendanceRate >= 90 
                        ? 'Outstanding Performance!' 
                        : data.attendanceRate >= 75 
                        ? 'Good Progress - Room for Improvement'
                        : 'Attention Required'}
                    </p>
                    <p className={`text-sm mt-1 ${
                      data.attendanceRate >= 90 
                        ? 'text-green-600' 
                        : data.attendanceRate >= 75 
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {data.attendanceRate >= 90 
                        ? `${data.childName} has excellent attendance. Continue the great work!` 
                        : data.attendanceRate >= 75 
                        ? `${data.childName} is doing well. Aim for 90% attendance for optimal development.`
                        : `${data.childName} needs more regular attendance. Please consult with the Anganwadi worker.`}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Report Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Report Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h6 className="font-medium text-gray-900 mb-2">Overall Assessment</h6>
              <p className="text-sm text-gray-600">
                {overallStats.averageAttendance >= 90 
                  ? 'Excellent family commitment to education with outstanding attendance rates.'
                  : overallStats.averageAttendance >= 75 
                  ? 'Good attendance patterns with room for consistency improvement.'
                  : 'Attendance needs attention. Consider discussing barriers with Anganwadi staff.'}
              </p>
            </div>
            <div>
              <h6 className="font-medium text-gray-900 mb-2">Key Insights</h6>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• {overallStats.totalPresent} days of learning completed</li>
                <li>• {overallStats.totalSickLeaves} health-related absences</li>
                <li>• Average attendance: {overallStats.averageAttendance}%</li>
              </ul>
            </div>
            <div>
              <h6 className="font-medium text-gray-900 mb-2">Next Steps</h6>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Schedule parent-teacher meeting if needed</li>
                <li>• Review health and nutrition support</li>
                <li>• Celebrate achievements and progress</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render detailed attendance calendar view
  const renderDetailedView = () => (
    <div className="space-y-8">
      {/* Month/Year Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Detailed Attendance Calendar</h3>
        <div className="flex items-center space-x-4">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            {[2024, 2025].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar for each child */}
      {children.map(child => (
        <motion.div
          key={child.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                <Baby className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{child.name}</h4>
                <p className="text-sm text-gray-600">
                  {new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-100 rounded"></div>
                <span>Present</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-100 rounded"></div>
                <span>Absent</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-gray-100 rounded"></div>
                <span>Weekend</span>
              </div>
            </div>
          </div>
          
          {renderAttendanceCalendar(child)}
        </motion.div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Records</h2>
          <p className="text-gray-600">View your children's daily attendance records and monthly statistics</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {children.length} Children Tracked
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'detailed', label: 'Calendar View', icon: CalendarDays },
            { id: 'reports', label: 'Monthly Reports', icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                viewMode === tab.id
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {viewMode === 'overview' && renderOverview()}
      {viewMode === 'detailed' && renderDetailedView()}
      {viewMode === 'reports' && renderMonthlyReports()}
    </div>
  );
};

export default ParentAttendanceTracker;