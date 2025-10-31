"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Trash2, Calendar, User, Clock, DollarSign, Briefcase, Users, Pencil } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type Employee = {
  id: string
  name: string
  hourlyRate: number
  dublinRate: number // Added dublinRate
  role: string
}

type Project = {
  id: string
  name: string
  client: string
  status: "active" | "completed" | "pending"
  rateType: "local" | "dublin" // Added rateType
}

type TimeEntry = {
  id: string
  employeeId: string
  projectId: string
  date: string
  hours: number
}

type EmployeeAssignment = {
  employeeId: string
  hours: number
}

function getWeekStart(date: Date): Date {
  const weekStart = new Date(date)
  weekStart.setDate(date.getDate() - date.getDay())
  return weekStart
}

export default function ProjectDetailClient({ projectId }: { projectId: string }) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: "",
    client: "",
    status: "active" as Project["status"],
    rateType: "local" as Project["rateType"],
  })
  const [project, setProject] = useState<Project | undefined>(undefined) // Declare project state here

  useEffect(() => {
    console.log("[v0] Loading data from localStorage")
    // Load data from localStorage
    const storedEmployees = localStorage.getItem("employees")
    const storedProjects = localStorage.getItem("projects")
    const storedTimeEntries = localStorage.getItem("timeEntries")

    console.log("[v0] Stored time entries:", storedTimeEntries)

    if (storedEmployees) {
      const parsed = JSON.parse(storedEmployees)
      const migrated = parsed.map((emp: any) => ({
        ...emp,
        dublinRate: emp.dublinRate ?? emp.hourlyRate * 1.2,
      }))
      setEmployees(migrated)
    } else {
      const mockEmployees = [
        { id: "1", name: "John Smith", hourlyRate: 45, dublinRate: 55, role: "Carpenter" },
        { id: "2", name: "Sarah Johnson", hourlyRate: 55, dublinRate: 65, role: "Electrician" },
        { id: "3", name: "Mike Davis", hourlyRate: 40, dublinRate: 50, role: "Laborer" },
      ]
      setEmployees(mockEmployees)
      localStorage.setItem("employees", JSON.stringify(mockEmployees))
    }

    if (storedProjects) {
      const parsedProjects = JSON.parse(storedProjects)
      const migrated = parsedProjects.map((proj: any) => ({
        ...proj,
        rateType: proj.rateType ?? "local",
      }))
      setProjects(migrated)
      const foundProject = migrated.find((p: Project) => p.id === projectId)
      setProject(foundProject)
    } else {
      const mockProjects = [
        { id: "1", name: "Kitchen Renovation", client: "Smith Residence", status: "active", rateType: "local" },
        { id: "2", name: "Bathroom Remodel", client: "Johnson Home", status: "active", rateType: "dublin" },
      ]
      setProjects(mockProjects)
      localStorage.setItem("projects", JSON.stringify(mockProjects))
      const foundProject = mockProjects.find((p: Project) => p.id === projectId)
      setProject(foundProject)
    }

    if (storedTimeEntries) {
      const parsed = JSON.parse(storedTimeEntries)
      console.log("[v0] Parsed time entries:", parsed)
      setTimeEntries(parsed)
    } else {
      // Initialize with mock data if nothing in localStorage
      const mockTimeEntries = [
        { id: "1", employeeId: "1", projectId: "1", date: "2025-10-28", hours: 8 },
        { id: "2", employeeId: "2", projectId: "1", date: "2025-10-28", hours: 6 },
      ]
      setTimeEntries(mockTimeEntries)
      localStorage.setItem("timeEntries", JSON.stringify(mockTimeEntries))
    }
  }, [])

  useEffect(() => {
    if (project) {
      setEditFormData({
        name: project.name,
        client: project.client,
        status: project.status,
        rateType: project.rateType, // Include rateType in edit form data
      })
    }
  }, [project])

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [employeeAssignments, setEmployeeAssignments] = useState<EmployeeAssignment[]>([])

  if (!project) {
    return <div>Project not found</div>
  }

  const addEmployeeAssignment = () => {
    setEmployeeAssignments([...employeeAssignments, { employeeId: "", hours: 10 }])
  }

  const updateAssignment = (index: number, field: keyof EmployeeAssignment, value: string | number) => {
    const updated = [...employeeAssignments]
    updated[index] = { ...updated[index], [field]: value }
    setEmployeeAssignments(updated)
  }

  const removeAssignment = (index: number) => {
    setEmployeeAssignments(employeeAssignments.filter((_, i) => i !== index))
  }

  const saveAssignments = () => {
    console.log("[v0] saveAssignments called")
    console.log("[v0] Current employeeAssignments:", employeeAssignments)
    console.log("[v0] Selected date:", selectedDate)
    console.log("[v0] Project ID:", projectId)

    const newEntries = employeeAssignments
      .filter((assignment) => assignment.employeeId && assignment.hours > 0)
      .map((assignment) => ({
        id: Date.now().toString() + Math.random(),
        employeeId: assignment.employeeId,
        projectId: projectId,
        date: selectedDate,
        hours: assignment.hours,
      }))

    console.log("[v0] New entries to add:", newEntries)
    console.log("[v0] Current timeEntries:", timeEntries)

    const updatedEntries = [...timeEntries, ...newEntries]
    console.log("[v0] Updated entries:", updatedEntries)

    setTimeEntries(updatedEntries)
    localStorage.setItem("timeEntries", JSON.stringify(updatedEntries))

    console.log("[v0] Saved to localStorage")
    console.log("[v0] Verification - localStorage value:", localStorage.getItem("timeEntries"))

    setEmployeeAssignments([])
  }

  const handleUpdateProject = (e: React.FormEvent) => {
    e.preventDefault()
    const updatedProjects = projects.map((p) =>
      p.id === projectId
        ? {
            ...p,
            name: editFormData.name,
            client: editFormData.client,
            status: editFormData.status,
            rateType: editFormData.rateType, // Include rateType in update
          }
        : p,
    )
    setProjects(updatedProjects)
    localStorage.setItem("projects", JSON.stringify(updatedProjects))
    setProject(updatedProjects.find((p) => p.id === projectId))
    setIsEditOpen(false)
  }

  const projectEntries = timeEntries.filter((entry) => entry.projectId === projectId)
  const entriesByDate = projectEntries.reduce(
    (acc, entry) => {
      if (!acc[entry.date]) {
        acc[entry.date] = []
      }
      acc[entry.date].push(entry)
      return acc
    },
    {} as Record<string, TimeEntry[]>,
  )

  const calculateTotalCost = () => {
    if (!project) return 0
    return projectEntries.reduce((total, entry) => {
      const employee = employees.find((e) => e.id === entry.employeeId)
      if (!employee) return total
      const rate = project.rateType === "dublin" ? employee.dublinRate : employee.hourlyRate
      return total + rate * entry.hours
    }, 0)
  }

  const calculateDateCost = (entries: TimeEntry[]) => {
    if (!project) return 0
    return entries.reduce((total, entry) => {
      const employee = employees.find((e) => e.id === entry.employeeId)
      if (!employee) return total
      const rate = project.rateType === "dublin" ? employee.dublinRate : employee.hourlyRate
      return total + rate * entry.hours
    }, 0)
  }

  const weeklyData = projectEntries.reduce(
    (acc, entry) => {
      const weekStart = getWeekStart(new Date(entry.date))
      const weekKey = weekStart.toISOString().split("T")[0]

      if (!acc[weekKey]) {
        acc[weekKey] = { entries: [], totalHours: 0, totalCost: 0 }
      }

      const employee = employees.find((e) => e.id === entry.employeeId)
      if (employee && project) {
        const rate = project.rateType === "dublin" ? employee.dublinRate : employee.hourlyRate
        const cost = rate * entry.hours

        acc[weekKey].entries.push(entry)
        acc[weekKey].totalHours += entry.hours
        acc[weekKey].totalCost += cost
      }

      return acc
    },
    {} as Record<string, { entries: TimeEntry[]; totalHours: number; totalCost: number }>,
  )

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
          <Link href="/">
            <Button size="sm" variant="ghost" className="mb-4 text-xs sm:text-sm">
              <ArrowLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{project.name}</h1>
              <p className="text-muted-foreground mt-1 text-xs sm:text-sm">{project.client}</p>
              <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                Using:{" "}
                <span className="font-semibold">{project.rateType === "dublin" ? "Dublin Rate" : "Local Rate"}</span>
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1 sm:gap-2 bg-transparent text-xs sm:text-sm">
                    <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-sm sm:text-base">Edit Project</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUpdateProject} className="space-y-4">
                    <div>
                      <Label className="py-0 text-xs sm:text-sm" htmlFor="edit-project-name">
                        Project Name
                      </Label>
                      <Input
                        className="py-1"
                        id="edit-project-name"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm" htmlFor="edit-client">
                        Client
                      </Label>
                      <Input
                        className="py-1"
                        id="edit-client"
                        value={editFormData.client}
                        onChange={(e) => setEditFormData({ ...editFormData, client: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm" htmlFor="edit-status">
                        Status
                      </Label>
                      <Select
                        value={editFormData.status}
                        onValueChange={(value: Project["status"]) =>
                          setEditFormData({ ...editFormData, status: value })
                        }
                      >
                        <SelectTrigger id="edit-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm" htmlFor="edit-rateType">
                        Rate Type
                      </Label>
                      <Select
                        value={editFormData.rateType}
                        onValueChange={(value: Project["rateType"]) =>
                          setEditFormData({ ...editFormData, rateType: value })
                        }
                      >
                        <SelectTrigger id="edit-rateType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local">Local Rate</SelectItem>
                          <SelectItem value="dublin">Dublin Rate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" size="sm" className="w-full text-xs sm:text-sm">
                      Update Project
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              <img
                src="/images/design-mode/Brackvale%20Logo%20No%20BG.png"
                alt="Brackvale Logo"
                className="h-12 w-auto sm:h-16 md:h-20"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Project Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Project Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Labor Cost</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold">€{calculateTotalCost().toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Hours</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold">
                    {projectEntries.reduce((sum, entry) => sum + entry.hours, 0)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Status</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold capitalize">{project.status}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Weekly Cost Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.keys(weeklyData)
                .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                .map((weekStart) => {
                  const data = weeklyData[weekStart]
                  const weekEnd = new Date(weekStart)
                  weekEnd.setDate(weekEnd.getDate() + 6)

                  return (
                    <div key={weekStart} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm sm:text-base">
                            {formatDate(weekStart)} - {formatDate(weekEnd.toISOString().split("T")[0])}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{data.totalHours} hours worked</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base sm:text-lg md:text-xl font-bold">€{data.totalCost.toFixed(2)}</p>
                      </div>
                    </div>
                  )
                })}
              {Object.keys(weeklyData).length === 0 && (
                <p className="text-center text-muted-foreground py-8">No time entries yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Employees for Date */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Add Employees to Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="date" className="text-xs sm:text-sm">
                Select Date
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            </div>

            <div className="space-y-3">
              {employeeAssignments.map((assignment, index) => (
                <div key={index} className="flex items-end gap-3 p-4 border rounded-lg">
                  <div className="flex-1">
                    <Label className="text-xs sm:text-sm">Employee</Label>
                    <Select
                      value={assignment.employeeId}
                      onValueChange={(value) => updateAssignment(index, "employeeId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name} - €
                            {project.rateType === "dublin" ? employee.dublinRate : employee.hourlyRate}/hr (
                            {employee.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-32">
                    <Label className="text-xs sm:text-sm">Hours</Label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      value={assignment.hours || ""}
                      onChange={(e) => updateAssignment(index, "hours", Number.parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeAssignment(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={addEmployeeAssignment}
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm bg-transparent"
              >
                <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Add Employee
              </Button>
              {employeeAssignments.length > 0 && (
                <Button size="sm" onClick={saveAssignments} className="text-xs sm:text-sm">
                  Save All Assignments
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Time Entries by Date */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Time Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.keys(entriesByDate)
                .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                .map((date) => {
                  const entries = entriesByDate[date]
                  const dateCost = calculateDateCost(entries)
                  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0)

                  return (
                    <div key={date} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <h3 className="font-semibold text-sm sm:text-base">{formatDate(date)}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-xs sm:text-sm text-muted-foreground">{totalHours} hours</p>
                          <p className="font-semibold text-sm sm:text-base">€{dateCost.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {entries.map((entry) => {
                          const employee = employees.find((e) => e.id === entry.employeeId)
                          const cost = employee
                            ? (project.rateType === "dublin" ? employee.dublinRate : employee.hourlyRate) * entry.hours
                            : 0

                          return (
                            <div key={entry.id} className="flex items-center justify-between bg-muted/50 p-3 rounded">
                              <div className="flex items-center gap-3">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-xs sm:text-sm">{employee?.name}</p>
                                  <p className="text-xs text-muted-foreground">{employee?.role}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-xs sm:text-sm">{entry.hours} hrs</p>
                                <p className="text-xs text-muted-foreground">€{cost.toFixed(2)}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
