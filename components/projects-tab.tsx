"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Euro, ChevronRight, Pencil } from "lucide-react"
import Link from "next/link"
import type { Project, TimeEntry, Employee } from "@/app/page"

type ProjectsTabProps = {
  projects: Project[]
  timeEntries: TimeEntry[]
  employees: Employee[]
  onAddProject: (project: Omit<Project, "id">) => void
  onUpdateProject: (id: string, updates: Partial<Project>) => void
}

export function ProjectsTab({ projects, timeEntries, employees, onAddProject, onUpdateProject }: ProjectsTabProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    client: "",
    status: "active" as Project["status"],
    rateType: "local" as Project["rateType"],
  })
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddProject(formData)
    setFormData({ name: "", client: "", status: "active", rateType: "local" })
    setIsOpen(false)
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setIsEditOpen(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingProject) {
      onUpdateProject(editingProject.id, {
        name: editingProject.name,
        client: editingProject.client,
        status: editingProject.status,
        rateType: editingProject.rateType,
      })
      setIsEditOpen(false)
      setEditingProject(null)
    }
  }

  const calculateProjectCost = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return 0

    return timeEntries
      .filter((entry) => entry.projectId === projectId)
      .reduce((total, entry) => {
        const employee = employees.find((e) => e.id === entry.employeeId)
        if (!employee) return total
        const rate = project.rateType === "dublin" ? employee.dublinRate : employee.hourlyRate
        return total + rate * entry.hours
      }, 0)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-base font-light">
        <h2 className="font-semibold text-sm sm:text-base">Projects</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="text-xs sm:text-sm">
              <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-sm sm:text-base">Add New Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="py-0 text-xs sm:text-sm" htmlFor="project-name">
                  Project Name
                </Label>
                <Input
                  className="py-1"
                  id="project-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label className="text-xs sm:text-sm" htmlFor="client">
                  Client
                </Label>
                <Input
                  className="py-1"
                  id="client"
                  value={formData.client}
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label className="text-xs sm:text-sm" htmlFor="status">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Project["status"]) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
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
                <Label className="text-xs sm:text-sm" htmlFor="rateType">
                  Rate Type
                </Label>
                <Select
                  value={formData.rateType}
                  onValueChange={(value: Project["rateType"]) => setFormData({ ...formData, rateType: value })}
                >
                  <SelectTrigger id="rateType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local Rate</SelectItem>
                    <SelectItem value="dublin">Dublin Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" size="sm" className="w-full text-xs sm:text-sm">
                Add Project
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base">Edit Project</DialogTitle>
          </DialogHeader>
          {editingProject && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <Label className="py-0 text-xs sm:text-sm" htmlFor="edit-project-name">
                  Project Name
                </Label>
                <Input
                  className="py-1"
                  id="edit-project-name"
                  value={editingProject.name}
                  onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
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
                  value={editingProject.client}
                  onChange={(e) => setEditingProject({ ...editingProject, client: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label className="text-xs sm:text-sm" htmlFor="edit-status">
                  Status
                </Label>
                <Select
                  value={editingProject.status}
                  onValueChange={(value: Project["status"]) => setEditingProject({ ...editingProject, status: value })}
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
                  value={editingProject.rateType}
                  onValueChange={(value: Project["rateType"]) =>
                    setEditingProject({ ...editingProject, rateType: value })
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
          )}
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => {
          const totalCost = calculateProjectCost(project.id)
          const projectHours = timeEntries
            .filter((entry) => entry.projectId === project.id)
            .reduce((sum, entry) => sum + entry.hours, 0)

          return (
            <Card key={project.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-sm sm:text-base">{project.name}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        project.status === "active"
                          ? "bg-green-100 text-green-800"
                          : project.status === "completed"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {project.status}
                    </span>
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(project)} className="h-8 w-8">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-muted-foreground text-xs">{project.client}</p>
                  <div className="flex items-center gap-2">
                    <Euro className="h-5 w-5 text-muted-foreground" />
                    <span className="font-bold text-sm sm:text-base">€{totalCost.toFixed(2)}</span>
                  </div>
                  <p className="text-muted-foreground text-xs">{projectHours} hours logged</p>
                  <Link href={`/projects/${project.id}`}>
                    <Button size="sm" variant="outline" className="w-full mt-2 bg-transparent text-xs sm:text-sm">
                      View Details
                      <ChevronRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
