"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Link from "next/link"
import { Plus, Pencil, Trash2, Eye } from "lucide-react"
import type { Employee } from "@/app/page"

type EmployeesTabProps = {
  employees: Employee[]
  onAddEmployee: (employee: Omit<Employee, "id">) => void
  onUpdateEmployee: (id: string, updates: Partial<Employee>) => void
  onDeleteEmployee: (id: string) => void
}

export function EmployeesTab({ employees, onAddEmployee, onUpdateEmployee, onDeleteEmployee }: EmployeesTabProps) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState({ name: "", hourlyRate: "", dublinRate: "", role: "" })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingEmployee) {
      onUpdateEmployee(editingEmployee.id, {
        name: formData.name,
        hourlyRate: Number.parseFloat(formData.hourlyRate),
        dublinRate: Number.parseFloat(formData.dublinRate),
        role: formData.role,
      })
      setEditingEmployee(null)
    } else {
      onAddEmployee({
        name: formData.name,
        hourlyRate: Number.parseFloat(formData.hourlyRate),
        dublinRate: Number.parseFloat(formData.dublinRate),
        role: formData.role,
      })
      setIsAddOpen(false)
    }
    setFormData({ name: "", hourlyRate: "", dublinRate: "", role: "" })
  }

  const startEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      name: employee.name,
      hourlyRate: employee.hourlyRate.toString(),
      dublinRate: employee.dublinRate.toString(),
      role: employee.role,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-sm sm:text-base">Employees</h2>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="text-xs sm:text-sm">
              <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="hourlyRate">Local Rate (€/hr)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="dublinRate">Dublin Rate (€/hr)</Label>
                <Input
                  id="dublinRate"
                  type="number"
                  step="0.01"
                  value={formData.dublinRate}
                  onChange={(e) => setFormData({ ...formData, dublinRate: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" size="sm" className="w-full text-xs sm:text-sm">
                Add Employee
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {employees.map((employee) => (
          <Card key={employee.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-sm sm:text-base">{employee.name}</span>
                <div className="flex gap-2">
                  <Link href={`/employees/${employee.id}`}>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Dialog
                    open={editingEmployee?.id === employee.id}
                    onOpenChange={(open) => {
                      if (!open) {
                        setEditingEmployee(null)
                        setFormData({ name: "", hourlyRate: "", dublinRate: "", role: "" })
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => startEdit(employee)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Employee</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="edit-name">Name</Label>
                          <Input
                            id="edit-name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-role">Role</Label>
                          <Input
                            id="edit-role"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-hourlyRate">Local Rate (€/hr)</Label>
                          <Input
                            id="edit-hourlyRate"
                            type="number"
                            step="0.01"
                            value={formData.hourlyRate}
                            onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-dublinRate">Dublin Rate (€/hr)</Label>
                          <Input
                            id="edit-dublinRate"
                            type="number"
                            step="0.01"
                            value={formData.dublinRate}
                            onChange={(e) => setFormData({ ...formData, dublinRate: e.target.value })}
                            required
                          />
                        </div>
                        <Button type="submit" size="sm" className="w-full text-xs sm:text-sm">
                          Update Employee
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="icon" onClick={() => onDeleteEmployee(employee.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs">{employee.role}</p>
                <div className="space-y-1">
                  <p className="font-bold text-xs sm:text-sm">Local: €{employee.hourlyRate}/hr</p>
                  <p className="font-bold text-xs sm:text-sm">Dublin: €{employee.dublinRate}/hr</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
