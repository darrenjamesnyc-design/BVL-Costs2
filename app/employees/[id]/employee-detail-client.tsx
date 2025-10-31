"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, DollarSign, Briefcase, Users, Download, FileText } from "lucide-react"
import Link from "next/link"
import type { Employee, Project, TimeEntry } from "@/app/page"
import { formatDate } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { startOfWeek, endOfWeek } from "date-fns"

/* ----------  TYPES  ---------- */
type EmployeeDetailClientProps = { employeeId: string }

type WeeklySummary = {
  weekStart: string
  weekEnd: string
  totalHours: number
  totalCost: number
  entries: number
}

type DailyEntry = { date: string; projectName: string; hours: number; cost: number }
type WeeklyTimesheet = {
  weekStart: string
  weekEnd: string
  dailyEntries: DailyEntry[]
  totalHours: number
  totalCost: number
}

/* ----------  COMPONENT  ---------- */
export function EmployeeDetailClient({ employeeId }: EmployeeDetailClientProps) {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedWeek, setSelectedWeek] = useState<string>("")
  const [weeklySummaries, setWeeklySummaries] = useState<WeeklySummary[]>([])

  /* ----------  LOCAL STORAGE HYDRATION  ---------- */
  useEffect(() => {
    const storedEmployees = localStorage.getItem("employees")
    const storedTimeEntries = localStorage.getItem("timeEntries")
    const storedProjects = localStorage.getItem("projects")

    if (storedEmployees) {
      const list: Employee[] = JSON.parse(storedEmployees)
      setEmployees(list)
      setEmployee(list.find((e) => e.id === employeeId) ?? null)
    }
    if (storedTimeEntries) {
      const list: TimeEntry[] = JSON.parse(storedTimeEntries)
      setTimeEntries(list.filter((e) => e.employeeId === employeeId))
    }
    if (storedProjects) setProjects(JSON.parse(storedProjects))
  }, [employeeId])

  /* ----------  CALCULATE → UPSERT → SUBSCRIBE  ---------- */
  useEffect(() => {
  const calculateWeeklySummaries = (): WeeklySummary[] => {
    const map = new Map<string, WeeklySummary>()
    timeEntries.forEach((entry) => {
      const start = startOfWeek(new Date(entry.date))
      const key = start.toISOString()
      if (!map.has(key)) {
        map.set(key, {
          weekStart: start.toISOString().slice(0, 10),
          weekEnd: endOfWeek(new Date(entry.date)).toISOString().slice(0, 10),
          totalHours: 0,
          totalCost: 0,
          entries: 0,
        })
      }
      const ws = map.get(key)!
      ws.totalHours += entry.hours
      ws.totalCost += entry.hours * (entry.rate ?? 0) // ensure rate is numeric
      ws.entries += 1
    })
    return Array.from(map.values())
  }

  const summaries = calculateWeeklySummaries()

  /* 1.  UPSERT (null-safe) */
  summaries.forEach((s) =>
    supabase
      .from('weekly_summaries')
      .upsert({
        week_start: s.weekStart,
        week_end: s.weekEnd,
        total_hours: s.totalHours,
        total_cost: s.totalCost ?? 0, // NEVER null
        entries: s.entries,
        employee_id: employeeId,
      })
      .then((res) => console.log('upsert result', res))
      .catch((err) => console.error('upsert failed', err))
  )
    /* 2.  READ + LIVE SUBSCRIBE */
    const readAndSubscribe = () => {
      supabase
        .from("weekly_summaries")
        .select("*")
        .eq("employee_id", employeeId)
        .order("week_start", { ascending: false })
        .then(({ data }) => setWeeklySummaries(data ?? []))

      const sub = supabase
        .channel(`summaries-${employeeId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "weekly_summaries" },
          (payload) => {
            console.log("real-time payload", payload) // helps while testing
            if (payload.eventType === "INSERT")
              setWeeklySummaries((prev) => [payload.new as WeeklySummary, ...prev])
            if (payload.eventType === "DELETE")
              setWeeklySummaries((prev) => prev.filter((r) => r.id !== payload.old.id))
            if (payload.eventType === "UPDATE")
              setWeeklySummaries((prev) =>
                prev.map((r) => (r.id === payload.new.id ? (payload.new as WeeklySummary) : r))
              )
          }
        )
        .subscribe()

      return () => supabase.removeChannel(sub)
    }

    readAndSubscribe()
  }, [timeEntries, employeeId])

  /* ----------  SELECT FIRST WEEK AUTOMATICALLY  ---------- */
  useEffect(() => {
    if (weeklySummaries.length && !selectedWeek) setSelectedWeek(weeklySummaries[0].weekStart)
  }, [weeklySummaries, selectedWeek])

  /* ----------  RENDER HELPERS  ---------- */
  if (!employee) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <p>Employee not found</p>
        </div>
      </div>
    )
  }

  const totalCost = timeEntries.reduce((sum, entry) => sum + entry.hours * employee.hourlyRate, 0)
  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0)
  const employeeProjects = projects.filter((project) => timeEntries.some((entry) => entry.projectId === project.id))

  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.setDate(diff))
  }

  const createWeeklyTimesheets = (): WeeklyTimesheet[] => {
    const map = new Map<string, WeeklyTimesheet>()
    timeEntries.forEach((entry) => {
      const entryDate = new Date(entry.date)
      const weekStart = getWeekStart(entryDate)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      const key = weekStart.toISOString().split("T")[0]

      if (!map.has(key)) {
        map.set(key, {
          weekStart: key,
          weekEnd: weekEnd.toISOString().split("T")[0],
          dailyEntries: [],
          totalHours: 0,
          totalCost: 0,
        })
      }
      const timesheet = map.get(key)!
      const project = projects.find((p) => p.id === entry.projectId) as Project | undefined
      const cost = entry.hours * employee.hourlyRate

      timesheet.dailyEntries.push({
        date: entry.date,
        projectName: project?.name ?? "Unknown Project",
        hours: entry.hours,
        cost,
      })
      timesheet.totalHours += entry.hours
      timesheet.totalCost += cost
    })

    const sheets = Array.from(map.values())
    sheets.sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime())
    sheets.forEach((t) => t.dailyEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
    return sheets
  }

  const weeklyTimesheets = createWeeklyTimesheets()

  /* ----------  EXPORT HELPERS  ---------- */
  const exportToExcel = (timesheet: WeeklyTimesheet) => {
    import("xlsx").then((XLSX) => {
      const data = [
        ["BRACKVALE"],
        ["Employee Timesheet"],
        [""],
        ["Employee:", employee.name],
        ["Role:", employee.role],
        ["Local Rate:", `€${employee.hourlyRate}`],
        ["Dublin Rate:", `€${employee.dublinRate}`],
        ["Week:", `${formatDate(timesheet.weekStart)} - ${formatDate(timesheet.weekEnd)}`],
        [""],
        ["Date", "Project", "Hours", "Cost"],
        ...timesheet.dailyEntries.map((e) => [formatDate(e.date), e.projectName, e.hours, `€${e.cost.toFixed(2)}`]),
        [""],
        ["Total", "", timesheet.totalHours, `€${timesheet.totalCost.toFixed(2)}`],
      ]

      const ws = XLSX.utils.aoa_to_sheet(data)
      ws["!cols"] = [{ wch: 20 }, { wch: 30 }, { wch: 10 }, { wch: 12 }]
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Timesheet")
      XLSX.writeFile(wb, `${employee.name}_Timesheet_${timesheet.weekStart}.xlsx`)
    })
  }

  const exportToPDF = (timesheet: WeeklyTimesheet) => {
    import("jspdf").then((jsPDFModule) => {
      import("jspdf-autotable").then((autoTableModule) => {
        const jsPDF = jsPDFModule.default
        const autoTable = autoTableModule.default
        const doc = new jsPDF()

        const navyBlue = [26, 58, 82]
        const teal = [107, 196, 201]

        doc.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2])
        doc.setFontSize(20)
        doc.setFont(undefined, "bold")
        doc.text("Employee Timesheet", 14, 25)
        doc.setFontSize(11)
        doc.setFont(undefined, "normal")
        doc.setTextColor(0, 0, 0)
        doc.text(`Employee: ${employee.name}`, 14, 45)
        doc.text(`Role: ${employee.role}`, 14, 52)
        doc.text(`Local Rate: €${employee.hourlyRate} | Dublin Rate: €${employee.dublinRate}`, 14, 59)
        doc.text(`Week: ${formatDate(timesheet.weekStart)} - ${formatDate(timesheet.weekEnd)}`, 14, 66)

        const body = timesheet.dailyEntries.map((e) => [formatDate(e.date), e.projectName, e.hours.toFixed(1), `€${e.cost.toFixed(2)}`])
        body.push(["Total", "", timesheet.totalHours.toFixed(1), `€${timesheet.totalCost.toFixed(2)}`])

        autoTable(doc, {
          startY: 75,
          head: [["Date", "Project", "Hours", "Cost"]],
          body,
          theme: "grid",
          headStyles: { fillColor: navyBlue, textColor: [255, 255, 255], fontStyle: "bold" },
          footStyles: { fillColor: teal, textColor: [255, 255, 255], fontStyle: "bold" },
        })

        doc.save(`${employee.name}_Timesheet_${timesheet.weekStart}.pdf`)
      })
    })
  }

  const generatePayslip = (timesheet: WeeklyTimesheet) => {
    import("jspdf").then((jsPDFModule) => {
      const jsPDF = jsPDFModule.default
      const doc = new jsPDF()
      const navyBlue = [26, 58, 82]
      const teal = [107, 196, 201]
      const gold = [253, 185, 19]

      doc.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2])
      doc.setFontSize(24)
      doc.setFont(undefined, "bold")
      doc.text("PAYSLIP", 105, 55, { align: "center" })

      doc.setFillColor(teal[0], teal[1], teal[2])
      doc.rect(14, 65, 182, 8, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.text("Employee Information", 16, 71)

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(10)
      doc.setFont(undefined, "normal")
      doc.text(`Name: ${employee.name}`, 16, 82)
      doc.text(`Role: ${employee.role}`, 16, 89)
      doc.text(`Local Rate: €${employee.hourlyRate}/hr | Dublin Rate: €${employee.dublinRate}/hr`, 16, 96)

      doc.setFillColor(teal[0], teal[1], teal[2])
      doc.rect(14, 105, 182, 8, "F")
      doc.setTextColor(255, 255, 255)
      doc.text("Pay Period", 16, 111)
      doc.setTextColor(0, 0, 0)
      doc.text(`${formatDate(timesheet.weekStart)} - ${formatDate(timesheet.weekEnd)}`, 16, 122)

      doc.setFillColor(teal[0], teal[1], teal[2])
      doc.rect(14, 135, 182, 8, "F")
      doc.setTextColor(255, 255, 255)
      doc.text("Earnings", 16, 141)

      doc.setFillColor(navyBlue[0], navyBlue[1], navyBlue[2])
      doc.rect(14, 150, 182, 8, "F")
      doc.setTextColor(255, 255, 255)
      doc.text("Description", 16, 156)
      doc.text("Hours", 100, 156)
      doc.text("Rate", 130, 156)
      doc.text("Amount", 160, 156)

      doc.setTextColor(0, 0, 0)
      doc.text("Regular Hours", 16, 168)
      doc.text(timesheet.totalHours.toFixed(1), 100, 168)
      doc.text(`€${employee.hourlyRate}`, 130, 168)
      doc.text(`€${timesheet.totalCost.toFixed(2)}`, 160, 168)

      doc.setFillColor(gold[0], gold[1], gold[2])
      doc.rect(14, 180, 182, 12, "F")
      doc.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2])
      doc.setFontSize(14)
      doc.setFont(undefined, "bold")
      doc.text("Total Payment:", 16, 188)
      doc.setFontSize(16)
      doc.text(`€${timesheet.totalCost.toFixed(2)}`, 160, 188)

      doc.setTextColor(100, 100, 100)
      doc.setFontSize(8)
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 280, { align: "center" })

      doc.save(`${employee.name}_Payslip_${timesheet.weekStart}.pdf`)
    })
  }

  /* ----------  RENDER  ---------- */
  const selectedTimesheet = weeklyTimesheets.find((t) => t.weekStart === selectedWeek)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex gap-2 mb-4">
            <Link href="/?tab=projects">
              <Button size="sm" variant="outline" className="gap-1 sm:gap-2 bg-transparent text-xs sm:text-sm">
                <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" />
                Projects
              </Button>
            </Link>
            <Link href="/?tab=employees">
              <Button size="sm" variant="outline" className="gap-1 sm:gap-2 bg-transparent text-xs sm:text-sm">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                Employees
              </Button>
            </Link>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{employee.name}</h1>
              <p className="text-muted-foreground mt-1 text-xs sm:text-sm">{employee.role}</p>
              <div className="mt-2">
                <p className="text-xs sm:text-sm text-muted-foreground">Hourly Rate</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold">€{employee.hourlyRate}/hr</p>
              </div>
            </div>
            <img
              src="/images/design-mode/Brackvale%20Logo%20No%20BG.png"
              alt="Brackvale Logo"
              className="h-12 w-auto sm:h-16 md:h-20"
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Hours</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{totalHours.toFixed(1)} hrs</div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Across all projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">€{totalCost.toFixed(2)}</div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Total labor cost</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Projects</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{employeeProjects.length}</div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Active assignments</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Weekly Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklySummaries.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No time entries yet</p>
              ) : (
                weeklySummaries.map((week) => (
                  <div
                    key={week.weekStart}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm sm:text-base">
                        {formatDate(week.weekStart)} - {formatDate(week.weekEnd)}
                      </p>
                      <p className="text-sm sm:text-base text-muted-foreground">{week.entries} entries</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm sm:text-base">€{week.totalCost.toFixed(2)}</p>
                      <p className="text-sm sm:text-base text-muted-foreground">{week.totalHours.toFixed(1)} hours</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {employeeProjects.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No projects assigned yet</p>
              ) : (
                employeeProjects.map((project) => {
                  const projectEntries = timeEntries.filter((e) => e.projectId === project.id)
                  const projectHours = projectEntries.reduce((sum, e) => sum + e.hours, 0)
                  const projectCost = projectHours * employee.hourlyRate

                  return (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm sm:text-base">{project.name}</p>
                        <p className="text-sm sm:text-base text-muted-foreground">{project.client}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm sm:text-base">€{projectCost.toFixed(2)}</p>
                        <p className="text-sm sm:text-base text-muted-foreground">{projectHours.toFixed(1)} hours</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg">Weekly Timesheet</CardTitle>
              <div className="flex gap-2">
                <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Select a week" />
                  </SelectTrigger>
                  <SelectContent>
                    {weeklyTimesheets.map((timesheet) => (
                      <SelectItem key={timesheet.weekStart} value={timesheet.weekStart}>
                        {formatDate(timesheet.weekStart)} - {formatDate(timesheet.weekEnd)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedTimesheet ? (
              <div className="space-y-4">
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2 sm:p-3 font-medium text-xs sm:text-sm">Date</th>
                        <th className="text-left p-2 sm:p-3 font-medium text-xs sm:text-sm">Project</th>
                        <th className="text-right p-2 sm:p-3 font-medium text-xs sm:text-sm">Hours</th>
                        <th className="text-right p-2 sm:p-3 font-medium text-xs sm:text-sm">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTimesheet.dailyEntries.map((entry, index) => (
                        <tr key={index} className="border-t border-border">
                          <td className="p-2 sm:p-3 text-xs sm:text-sm">{formatDate(entry.date)}</td>
                          <td className="p-2 sm:p-3 text-xs sm:text-sm">{entry.projectName}</td>
                          <td className="p-2 sm:p-3 text-right text-xs sm:text-sm">{entry.hours.toFixed(1)}</td>
                          <td className="p-2 sm:p-3 text-right text-xs sm:text-sm">€{entry.cost.toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-border bg-muted font-bold">
                        <td className="p-2 sm:p-3 text-xs sm:text-sm" colSpan={2}>
                          Total
                        </td>
                        <td className="p-2 sm:p-3 text-right text-xs sm:text-sm">
                          {selectedTimesheet.totalHours.toFixed(1)}
                        </td>
                        <td className="p-2 sm:p-3 text-right text-xs sm:text-sm">
                          €{selectedTimesheet.totalCost.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportToExcel(selectedTimesheet)}
                    className="gap-1 sm:gap-2 text-xs sm:text-sm"
                  >
                    <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Export to Excel</span>
                    <span className="sm:hidden">Excel</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportToPDF(selectedTimesheet)}
                    className="gap-1 sm:gap-2 text-xs sm:text-sm"
                  >
                    <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Export to PDF</span>
                    <span className="sm:hidden">PDF</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => generatePayslip(selectedTimesheet)}
                    className="gap-1 sm:gap-2 text-xs sm:text-sm"
                  >
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Generate Payslip</span>
                    <span className="sm:hidden">Payslip</span>
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No timesheet data available</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}