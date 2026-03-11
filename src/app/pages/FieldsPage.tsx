import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Building2, Plus, Edit, Wrench, Loader2 } from 'lucide-react';
import { type Field } from '../data/mockData';
import { toast } from 'sonner';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useUnsplash } from '../hooks/useUnsplash';
import { pitchService, Field as ApiField } from '../api/pitch.service';

export function FieldsPage() {
  const [fields, setFields] = useState<ApiField[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<ApiField | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const data = await pitchService.getAllPitches();
      setFields(data);
    } catch (error: any) {
      toast.error(error.message || 'Không thể tải danh sách sân');
    } finally {
      setLoading(false);
    }
  };

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

  const getFieldPrices = (field: ApiField) => {
    return field.priceSlots || [];
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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-slate-500 font-medium">Đang tải danh sách sân...</p>
        </div>
      ) : fields.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Chưa có sân bóng nào</p>
          <Button variant="link" onClick={() => setIsDialogOpen(true)}>Thêm sân ngay</Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {fields.map((field) => {
            const prices = getFieldPrices(field);
            return (
              <Card key={field.id}>
                <CardHeader>
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4 shadow-inner">
                    <FieldImage query={field.image} />
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{field.name}</CardTitle>
                      <CardDescription>Sân {field.type} người</CardDescription>
                    </div>
                    {getStatusBadge(field.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px]">{field.description}</p>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-700">Bảng giá:</p>
                    {prices.length > 0 ? (
                      <div className="bg-slate-50 p-3 rounded-lg space-y-1.5 border border-slate-100">
                        {prices.map((price) => (
                          <div key={price.id} className="flex justify-between text-xs">
                            <span className="text-gray-600 font-medium">
                              {price.startTime} - {price.endTime}
                            </span>
                            <span className="font-bold text-emerald-600">
                              {price.price.toLocaleString('vi-VN')}đ/h
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600 italic">Chưa cài đặt bảng giá</p>
                    )}
                  </div>

                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Trạng thái sân</Label>
                    <Select
                      value={field.status}
                      onValueChange={(value) => handleStatusChange(field.id, value as Field['status'])}
                    >
                      <SelectTrigger className="h-9">
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
                    <Button variant="outline" className="flex-1 gap-2 h-9 text-xs">
                      <Edit className="w-3.5 h-3.5" />
                      Sửa
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2 h-9 text-xs">
                      <Wrench className="w-3.5 h-3.5" />
                      Giá
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
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
