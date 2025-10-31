"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { EmployeesTab } from "@/components/employees-tab"
import { ProjectsTab } from "@/components/projects-tab"
import { Briefcase, Users } from "lucide-react"

export type Employee = {
  id: string
  name: string
  hourlyRate: number // Local Rate
  dublinRate: number // Dublin Rate
  role: string
}

export type Project = {
  id: string
  name: string
  client: string
  status: "active" | "completed" | "pending"
  rateType: "local" | "dublin" // Which rate to use for this project
}

export type TimeEntry = {
  id: string
  employeeId: string
  projectId: string
  date: string
  hours: number
}

export default function LaborCostTracker() {
  const searchParams = useSearchParams()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const tabFromUrl = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState(tabFromUrl === "employees" ? "employees" : "projects")

  useEffect(() => {
    if (tabFromUrl === "employees") {
      setActiveTab("employees")
    } else if (tabFromUrl === "projects") {
      setActiveTab("projects")
    }
  }, [tabFromUrl])

  useEffect(() => {
    const storedEmployees = localStorage.getItem("employees")
    const storedProjects = localStorage.getItem("projects")
    const storedTimeEntries = localStorage.getItem("timeEntries")

    if (storedEmployees) {
      const parsed = JSON.parse(storedEmployees)
      const migrated = parsed.map((emp: any) => ({
        ...emp,
        dublinRate: emp.dublinRate ?? emp.hourlyRate * 1.2, // Default Dublin rate 20% higher
      }))
      setEmployees(migrated)
    } else {
      setEmployees([
        { id: "1", name: "John Smith", hourlyRate: 45, dublinRate: 55, role: "Carpenter" },
        { id: "2", name: "Sarah Johnson", hourlyRate: 55, dublinRate: 65, role: "Electrician" },
        { id: "3", name: "Mike Davis", hourlyRate: 40, dublinRate: 50, role: "Laborer" },
      ])
    }

    if (storedProjects) {
      const parsed = JSON.parse(storedProjects)
      const migrated = parsed.map((proj: any) => ({
        ...proj,
        rateType: proj.rateType ?? "local", // Default to local rate
      }))
      setProjects(migrated)
    } else {
      setProjects([
        { id: "1", name: "Kitchen Renovation", client: "Smith Residence", status: "active", rateType: "local" },
        { id: "2", name: "Bathroom Remodel", client: "Johnson Home", status: "active", rateType: "dublin" },
      ])
    }

    if (storedTimeEntries) {
      setTimeEntries(JSON.parse(storedTimeEntries))
    } else {
      setTimeEntries([
        { id: "1", employeeId: "1", projectId: "1", date: "2025-10-28", hours: 8 },
        { id: "2", employeeId: "2", projectId: "1", date: "2025-10-28", hours: 6 },
        { id: "3", employeeId: "1", projectId: "2", date: "2025-10-29", hours: 4 },
      ])
    }

    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("employees", JSON.stringify(employees))
    }
  }, [employees, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("projects", JSON.stringify(projects))
    }
  }, [projects, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("timeEntries", JSON.stringify(timeEntries))
    }
  }, [timeEntries, isLoaded])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="font-bold text-foreground text-base">Brackvale Labour Cost Tracker</h1>
              <p className="text-muted-foreground mt-1 text-xs">Track employee hours and labour costs across projects</p>
            </div>
            <img
              src="/images/design-mode/Brackvale%20Logo%20No%20BG.png"
              alt="Brackvale Logo"
              className="h-12 w-auto sm:h-16 md:h-20"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant={activeTab === "projects" ? "default" : "outline"}
              onClick={() => setActiveTab("projects")}
              className="gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" />
              Projects
            </Button>
            <Button
              size="sm"
              variant={activeTab === "employees" ? "default" : "outline"}
              onClick={() => setActiveTab("employees")}
              className="gap-1 sm:gap-2 text-xs sm:text-sm text-center"
            >
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              Employees
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsContent value="projects">
            <ProjectsTab
              projects={projects}
              timeEntries={timeEntries}
              employees={employees}
              onAddProject={(project) => setProjects([...projects, { ...project, id: Date.now().toString() }])}
              onUpdateProject={(id, updates) =>
                setProjects(projects.map((p) => (p.id === id ? { ...p, ...updates } : p)))
              }
            />
          </TabsContent>

          <TabsContent value="employees">
            <EmployeesTab
              employees={employees}
              onAddEmployee={(employee) => setEmployees([...employees, { ...employee, id: Date.now().toString() }])}
              onUpdateEmployee={(id, updates) =>
                setEmployees(employees.map((e) => (e.id === id ? { ...e, ...updates } : e)))
              }
              onDeleteEmployee={(id) => setEmployees(employees.filter((e) => e.id !== id))}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
