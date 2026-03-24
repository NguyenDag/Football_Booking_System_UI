import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Building2, Plus, Edit, Wrench, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useUnsplash } from '../hooks/useUnsplash';
import { pitchService, Field as ApiField } from '../api/pitch.service';
import { priceSlotService, PriceSlot } from '../api/price-slot.service';
import { Clock, DollarSign, Trash2, Calendar, Search, Filter, RefreshCcw, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

export function FieldsPage() {
  const [fields, setFields] = useState<ApiField[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<ApiField | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Pagination & Sorting state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE'>('ALL');
  const [sortField, setSortField] = useState<'name' | 'type'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 6;

  // Price slot management state
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
  const [selectedPitchForPrice, setSelectedPitchForPrice] = useState<ApiField | null>(null);
  const [priceSlots, setPriceSlots] = useState<PriceSlot[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [newPriceSlot, setNewPriceSlot] = useState({
    startTime: '05:00',
    endTime: '06:00',
    pricePerHour: 200000,
    applyOn: 'ALL' as 'WEEKDAY' | 'WEEKEND' | 'ALL',
    isPeakHour: false
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: '5' as '5' | '7' | '11',
    description: '',
    status: 'ACTIVE' as ApiField['status']
  });

  useEffect(() => {
    fetchFields();
  }, []);

  const processedFields = useMemo(() => {
    let list = fields.filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || f.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name, 'vi');
      else cmp = a.type.localeCompare(b.type, 'vi');
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [fields, searchTerm, statusFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(processedFields.length / PAGE_SIZE));
  const pagedFields = processedFields.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => setCurrentPage(1), [searchTerm, statusFilter, sortField, sortDir]);

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

  const handleStatusChange = async (fieldId: string, newStatus: string) => {
    try {
      await pitchService.updatePitch(fieldId, { status: newStatus });
      setFields(fields.map(f => 
        f.id === fieldId ? { ...f, status: newStatus } : f
      ) as ApiField[]);
      toast.success('Đã cập nhật trạng thái sân');
    } catch (error: any) {
      toast.error(error.message || 'Cập nhật trạng thái thất bại');
    }
  };

  const handleOpenAddDialog = () => {
    setEditingField(null);
    setFormData({ name: '', type: '5', description: '', status: 'ACTIVE' });
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (field: ApiField) => {
    setEditingField(field);
    setFormData({ 
      name: field.name, 
      type: field.type, 
      description: field.description, 
      status: field.status 
    });
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('Vui lòng nhập tên sân');
      return;
    }
    setSubmitting(true);
    try {
      let uploadedImageUrl = undefined;
      if (imageFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', imageFile);
        const token = localStorage.getItem('accessToken');
        const res = await fetch('https://localhost:7290/api/upload/image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataUpload
        });
        const uploadData = await res.json();
        if (uploadData.success) {
          uploadedImageUrl = uploadData.data;
        } else {
          toast.error(uploadData.message || 'Lỗi tải ảnh lên');
          setSubmitting(false);
          return;
        }
      }

      const pitchTypeMap = {
        '5': '5_PERSON',
        '7': '7_PERSON',
        '11': '11_PERSON'
      };
      
      const payload: any = {
        pitchName: formData.name,
        pitchType: pitchTypeMap[formData.type as keyof typeof pitchTypeMap],
        status: formData.status,
        description: formData.description
      };
      
      if (uploadedImageUrl) {
        payload.imageUrl = uploadedImageUrl;
      }

      if (editingField) {
        await pitchService.updatePitch(editingField.id, payload);
        toast.success('Cập nhật sân thành công');
      } else {
        await pitchService.createPitch(payload);
        toast.success('Thêm sân mới thành công');
      }
      setIsDialogOpen(false);
      fetchFields();
    } catch (error: any) {
      toast.error(error.message || 'Thao tác thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPriceDialog = async (field: ApiField) => {
    setSelectedPitchForPrice(field);
    setIsPriceDialogOpen(true);
    fetchPriceSlots(field.id);
  };

  const fetchPriceSlots = async (pitchId: string) => {
    try {
      setLoadingPrices(true);
      const data = await priceSlotService.getByPitchId(pitchId);
      setPriceSlots(data);
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi tải khung giá');
    } finally {
      setLoadingPrices(false);
    }
  };

  const handleAddPriceSlot = async () => {
    if (!selectedPitchForPrice) return;
    
    // Frontend validation for overlap
    const start = newPriceSlot.startTime + ':00';
    const end = newPriceSlot.endTime + ':00';
    
    const hasConflict = priceSlots.some(s => {
      const sameDay = (s.applyOn === 'ALL' || newPriceSlot.applyOn === 'ALL') || (s.applyOn === newPriceSlot.applyOn);
      const overlapTime = start < s.endTime && end > s.startTime;
      return sameDay && overlapTime;
    });

    if (hasConflict) {
      toast.error('Khung giờ này bị trùng với khung giờ hiện có!');
      return;
    }

    try {
      await priceSlotService.createSlot(selectedPitchForPrice.id, {
        ...newPriceSlot,
        startTime: start,
        endTime: end,
      });
      toast.success('Đã thêm khung giá');
      fetchPriceSlots(selectedPitchForPrice.id);
      fetchFields(); // Refresh main list to show new prices
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi thêm khung giá');
    }
  };

  const handleDeletePriceSlot = async (slotId: number) => {
    try {
      await priceSlotService.deleteSlot(slotId);
      toast.success('Đã xóa khung giá');
      if (selectedPitchForPrice) {
        fetchPriceSlots(selectedPitchForPrice.id);
        fetchFields();
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi xóa khung giá');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive", label: string }> = {
      ACTIVE: { variant: 'default', label: 'Hoạt động' },
      MAINTENANCE: { variant: 'secondary', label: 'Bảo trì' },
      INACTIVE: { variant: 'destructive', label: 'Ngừng hoạt động' },
    };
    const config = variants[status?.toUpperCase()] || { variant: 'secondary', label: status || 'Không rõ' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };
  const getFieldPrices = (field: ApiField) => {
    return field.priceSlots || [];
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Quản lý sân bóng</h1>
          <p className="text-gray-600 mt-1">Quản lý thông tin và giá các sân</p>
        </div>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 h-10 rounded-xl" onClick={handleOpenAddDialog}>
          <Plus className="w-4 h-4" />
          Thêm sân mới
        </Button>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 xl:items-center">
        {/* Search */}
        <div className="relative group flex-1">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
          <Input
            placeholder="Tìm theo tên sân..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-12 h-12 rounded-2xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500/10 transition-all bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'ACTIVE', label: 'Hoạt động' },
              { id: 'MAINTENANCE', label: 'Bảo trì' },
              { id: 'INACTIVE', label: 'Ngừng HĐ' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${statusFilter === f.id ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          {/* Sort */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <Select value={`${sortField}-${sortDir}`} onValueChange={v => { const [f, d] = v.split('-'); setSortField(f as any); setSortDir(d as any); }}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200 text-sm w-44 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="name-asc">Tên A → Z</SelectItem>
                <SelectItem value="name-desc">Tên Z → A</SelectItem>
                <SelectItem value="type-asc">Loại 5 → 11</SelectItem>
                <SelectItem value="type-desc">Loại 11 → 5</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="ghost" size="icon" onClick={fetchFields} className="h-11 w-11 rounded-xl text-slate-400 hover:text-emerald-600">
            <RefreshCcw className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editingField ? 'Sửa thông tin sân' : 'Thêm sân mới'}</DialogTitle>
            <DialogDescription>
              {editingField ? 'Cập nhật các thông tin của sân bóng.' : 'Điền thông tin sân bóng mới vào hệ thống.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-bold">Tên sân</Label>
              <Input 
                placeholder="VD: Sân E" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Loại sân</Label>
              <Select 
                value={formData.type}
                onValueChange={(val: any) => setFormData({...formData, type: val})}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Chọn loại sân" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="5">5 người</SelectItem>
                  <SelectItem value="7">7 người</SelectItem>
                  <SelectItem value="11">11 người</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Mô tả</Label>
              <Input 
                placeholder="Mô tả về sân" 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Ảnh sân</Label>
              <div className="flex items-center gap-4">
                <Button type="button" variant="outline" className="rounded-xl flex-1 justify-start gap-2 h-11" onClick={() => document.getElementById('fieldImageInput')?.click()}>
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span className="truncate">{imageFile ? imageFile.name : 'Chọn ảnh tải lên...'}</span>
                </Button>
                <input 
                  id="fieldImageInput" 
                  type="file" 
                  accept="image/jpeg,image/png,image/webp,image/gif" 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setImageFile(e.target.files[0]);
                    }
                  }}
                />
              </div>
            </div>
            {editingField && (
               <div className="space-y-2">
                <Label className="font-bold">Trạng thái</Label>
                <Select 
                  value={formData.status}
                  onValueChange={(val: any) => setFormData({...formData, status: val})}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                    <SelectItem value="MAINTENANCE">Bảo trì</SelectItem>
                    <SelectItem value="INACTIVE">Ngừng hoạt động</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-11 rounded-xl font-bold mt-2" 
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingField ? 'Cập nhật' : 'Thêm sân')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPriceDialogOpen} onOpenChange={setIsPriceDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
          <div className="bg-emerald-600 p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <DollarSign className="w-6 h-6" />
                Cấu hình giá: {selectedPitchForPrice?.name}
              </DialogTitle>
              <DialogDescription className="text-emerald-100">
                Thiết lập giá thuê sân theo các khung giờ khác nhau.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Form thêm mới */}
              <div className="flex flex-col gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <h4 className="font-bold flex items-center gap-2 text-slate-800">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  Thêm khung giờ mới
                </h4>
                <div className="space-y-4">
                  {/* Hàng 1: Thời gian */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase text-slate-500">Từ</Label>
                      <Input 
                        type="time" 
                        value={newPriceSlot.startTime}
                        onChange={e => setNewPriceSlot({...newPriceSlot, startTime: e.target.value})}
                        className="rounded-xl h-10 w-full px-3"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase text-slate-500">Đến</Label>
                      <Input 
                        type="time" 
                        value={newPriceSlot.endTime}
                        onChange={e => setNewPriceSlot({...newPriceSlot, endTime: e.target.value})}
                        className="rounded-xl h-10 w-full px-3"
                      />
                    </div>
                  </div>

                  {/* Hàng 2: Giá và Áp dụng */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase text-slate-500">Giá (VNĐ/h)</Label>
                      <Input 
                        type="number" 
                        step="10000"
                        value={newPriceSlot.pricePerHour}
                        onChange={e => setNewPriceSlot({...newPriceSlot, pricePerHour: parseInt(e.target.value)})}
                        className="rounded-xl h-10 w-full"
                      />
                    </div>
                    <div className="space-y-1.5">
                       <Label className="text-xs font-bold uppercase text-slate-500">Áp dụng</Label>
                       <Select 
                        value={newPriceSlot.applyOn}
                        onValueChange={(val: any) => setNewPriceSlot({...newPriceSlot, applyOn: val})}
                       >
                         <SelectTrigger className="rounded-xl h-10 w-full">
                            <SelectValue />
                         </SelectTrigger>
                         <SelectContent className="rounded-xl">
                            <SelectItem value="ALL">Cả tuần</SelectItem>
                            <SelectItem value="WEEKDAY">Ngày thường</SelectItem>
                            <SelectItem value="WEEKEND">Cuối tuần</SelectItem>
                         </SelectContent>
                       </Select>
                    </div>
                    <Button 
                      onClick={handleAddPriceSlot}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 h-10 rounded-xl font-bold transition-all sm:col-span-2 lg:col-span-1"
                    >
                      Thêm giá
                    </Button>
                  </div>
                </div>
              </div>

            {/* Danh sách hiện tại */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 flex items-center justify-between">
                Khung giá hiện tại
                <Badge variant="outline" className="text-xs font-normal text-slate-500">{priceSlots.length} khung</Badge>
              </h4>
              
              {loadingPrices ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
              ) : priceSlots.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 font-medium">Chưa có khung giá nào cho sân này</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {priceSlots.map((slot) => (
                    <div key={slot.priceSlotId} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-emerald-200 hover:shadow-md transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">
                            {slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
                              {slot.applyOn === 'ALL' ? 'Tất cả' : slot.applyOn === 'WEEKDAY' ? 'Thứ 2 - Thứ 6' : 'T7 & CN'}
                            </Badge>
                            {slot.isPeakHour && (
                              <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100 text-[10px] py-0 px-1.5 h-4 border-none">
                                Giờ cao điểm
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <p className="text-lg font-black text-emerald-600">
                          {slot.pricePerHour.toLocaleString('vi-VN')}đ
                        </p>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeletePriceSlot(slot.priceSlotId)}
                          className="text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all rounded-full"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-slate-500 font-medium">Đang tải danh sách sân...</p>
        </div>
      ) : pagedFields.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Không tìm thấy sân bóng nào</p>
          <Button variant="link" onClick={() => setIsDialogOpen(true)}>Thêm sân ngay</Button>
        </div>
      ) : (
        <>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pagedFields.map((field) => {
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
                          <div key={price.id} className="flex justify-between text-xs items-center gap-2">
                            <span className="text-gray-600 font-medium shrink-0">
                              {price.startTime} - {price.endTime}
                            </span>
                            <span className="text-slate-400 text-[10px] truncate">
                              ({price.applyOn === 'ALL' ? 'Cả tuần' : price.applyOn === 'WEEKDAY' ? 'T2 - T6' : 'T7 & CN'})
                            </span>
                            <span className="font-bold text-emerald-600 ml-auto">
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
                      onValueChange={(value) => handleStatusChange(field.id, value)}
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
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-1.5 h-9 text-[11px] font-semibold rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition-all px-2"
                      onClick={() => handleOpenEditDialog(field)}
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Sửa
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-1.5 h-9 text-[11px] font-semibold rounded-lg hover:border-blue-500 hover:text-blue-600 transition-all px-2"
                      onClick={() => handleOpenPriceDialog(field)}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      Giá
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <Button variant="outline" size="icon" className="rounded-xl border-slate-200" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${page === currentPage ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'text-slate-500 hover:bg-slate-100'}`}>
                  {page}
                </button>
              ))}
            </div>
            <Button variant="outline" size="icon" className="rounded-xl border-slate-200" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
        </>
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
