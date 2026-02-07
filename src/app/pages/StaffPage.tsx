import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Users, Plus, Edit, Calendar, Clock } from 'lucide-react';
import { mockStaffs, mockFields, type Staff } from '../data/mockData';
import { toast } from 'sonner';

export function StaffPage() {
  const [staffs, setStaffs] = useState(mockStaffs);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getDayName = (day: number): string => {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return days[day];
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý nhân viên</h1>
          <p className="text-gray-600 mt-1">Quản lý staff và phân công sân</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Thêm nhân viên
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Thêm nhân viên mới</DialogTitle>
              <DialogDescription>Điền thông tin và phân công sân cho nhân viên</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Họ tên</Label>
                  <Input placeholder="VD: Nguyễn Văn A" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" placeholder="email@example.com" />
                </div>
              </div>
              
              <div>
                <Label>Số điện thoại</Label>
                <Input placeholder="0901234567" />
              </div>

              <div>
                <Label className="mb-2 block">Phân công sân</Label>
                <div className="space-y-2">
                  {mockFields.map((field) => (
                    <div key={field.id} className="flex items-center space-x-2">
                      <Checkbox id={`field-${field.id}`} />
                      <label
                        htmlFor={`field-${field.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {field.name} - Sân {field.type} người
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Ca làm việc</Label>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((day) => (
                    <div key={day} className="flex items-center gap-4">
                      <Checkbox id={`day-${day}`} />
                      <label htmlFor={`day-${day}`} className="w-20 text-sm">
                        {getDayName(day)}
                      </label>
                      <Select defaultValue="08:00">
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="06:00">06:00</SelectItem>
                          <SelectItem value="08:00">08:00</SelectItem>
                          <SelectItem value="12:00">12:00</SelectItem>
                          <SelectItem value="14:00">14:00</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-gray-600">đến</span>
                      <Select defaultValue="17:00">
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="17:00">17:00</SelectItem>
                          <SelectItem value="18:00">18:00</SelectItem>
                          <SelectItem value="22:00">22:00</SelectItem>
                          <SelectItem value="23:00">23:00</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={() => {
                  toast.success('Đã thêm nhân viên mới');
                  setIsDialogOpen(false);
                }}
              >
                Thêm nhân viên
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {staffs.map((staff) => (
          <Card key={staff.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {staff.name}
                  </CardTitle>
                  <CardDescription>{staff.email}</CardDescription>
                </div>
                <Badge>Staff</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Số điện thoại</p>
                <p className="font-medium">{staff.phone}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Sân được phân công ({staff.assignedFields.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {staff.assignedFields.map((fieldId) => {
                    const field = mockFields.find(f => f.id === fieldId);
                    return (
                      <Badge key={fieldId} variant="secondary">
                        {field?.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Lịch làm việc
                </p>
                <div className="space-y-1 text-sm">
                  {staff.schedules.map((schedule, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{getDayName(schedule.dayOfWeek)}</span>
                      <span className="text-gray-600">
                        {schedule.startTime} - {schedule.endTime}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" className="flex-1 gap-2">
                  <Edit className="w-4 h-4" />
                  Sửa thông tin
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <Calendar className="w-4 h-4" />
                  Ca làm việc
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {staffs.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Chưa có nhân viên nào</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                Thêm nhân viên đầu tiên
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
