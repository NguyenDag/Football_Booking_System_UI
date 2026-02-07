import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Building2, Plus, Edit, Wrench } from 'lucide-react';
import { mockFields, mockPriceSlots, type Field } from '../data/mockData';
import { toast } from 'sonner';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useUnsplash } from '../hooks/useUnsplash';

export function FieldsPage() {
  const [fields, setFields] = useState(mockFields);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleStatusChange = (fieldId: string, newStatus: Field['status']) => {
    setFields(fields.map(f => 
      f.id === fieldId ? { ...f, status: newStatus } : f
    ));
    toast.success('Đã cập nhật trạng thái sân');
  };

  const getStatusBadge = (status: Field['status']) => {
    const variants = {
      ACTIVE: { variant: 'default' as const, label: 'Hoạt động' },
      MAINTENANCE: { variant: 'secondary' as const, label: 'Bảo trì' },
      INACTIVE: { variant: 'destructive' as const, label: 'Ngừng hoạt động' },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getFieldPrices = (fieldId: string) => {
    return mockPriceSlots.filter(ps => ps.fieldId === fieldId);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý sân bóng</h1>
          <p className="text-gray-600 mt-1">Quản lý thông tin và giá các sân</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Thêm sân mới
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm sân mới</DialogTitle>
              <DialogDescription>Điền thông tin sân bóng mới</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tên sân</Label>
                <Input placeholder="VD: Sân E" />
              </div>
              <div>
                <Label>Loại sân</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại sân" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 người</SelectItem>
                    <SelectItem value="7">7 người</SelectItem>
                    <SelectItem value="11">11 người</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mô tả</Label>
                <Input placeholder="Mô tả về sân" />
              </div>
              <Button className="w-full" onClick={() => {
                toast.success('Đã thêm sân mới');
                setIsDialogOpen(false);
              }}>
                Thêm sân
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => {
          const prices = getFieldPrices(field.id);
          return (
            <Card key={field.id}>
              <CardHeader>
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
                  <FieldImage query={field.image} />
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{field.name}</CardTitle>
                    <CardDescription>Sân {field.type} người</CardDescription>
                  </div>
                  {getStatusBadge(field.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{field.description}</p>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Bảng giá:</p>
                  {prices.map((price) => (
                    <div key={price.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {price.startTime} - {price.endTime}
                      </span>
                      <span className="font-medium">
                        {price.price.toLocaleString('vi-VN')}đ/h
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <Label>Trạng thái sân</Label>
                  <Select
                    value={field.status}
                    onValueChange={(value) => handleStatusChange(field.id, value as Field['status'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                      <SelectItem value="MAINTENANCE">Bảo trì</SelectItem>
                      <SelectItem value="INACTIVE">Ngừng hoạt động</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2">
                    <Edit className="w-4 h-4" />
                    Sửa
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2">
                    <Wrench className="w-4 h-4" />
                    Giá
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function FieldImage({ query }: { query: string }) {
  const imageUrl = useUnsplash(query);
  return (
    <ImageWithFallback
      src={imageUrl}
      alt="Football field"
      className="w-full h-full object-cover"
    />
  );
}
